import json
import time
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Request, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.models.model_config import ModelConfig
from app.models.request_log import RequestLog
from app.models.user import User
from app.models.gateway_token import GatewayToken
from app.services.nvidia import get_nvidia_api_key, call_nvidia_chat, stream_nvidia_chat
from app.api.proxy import resolve_model_for_request, _log_request, _format_error

logger = logging.getLogger(__name__)

router = APIRouter()

def authenticate_universal_request(request: Request, db: Session) -> User:
    """
    Universally authenticates requests from AGY, Codex, Claude Code, Cursor, Aider, or OpenAI SDKs.
    Checks Authorization Bearer, x-api-key, api-key, or anthropic-auth-token headers.
    """
    auth_header = (
        request.headers.get("authorization") or
        request.headers.get("x-api-key") or
        request.headers.get("api-key") or
        request.headers.get("anthropic-auth-token")
    )
    
    token = None
    if auth_header:
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
        else:
            token = auth_header
            
    if not token:
        # Check URL query param as fallback for some WebSocket/CLI tools
        token = request.query_params.get("key") or request.query_params.get("token")
        
    if not token:
        raise HTTPException(status_code=401, detail="Missing API token. Provide via Authorization header or x-api-key.")
        
    user = None
    if token.startswith("gw_"):
        import hashlib
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        gw_token = db.query(GatewayToken).filter(GatewayToken.token_hash == token_hash, GatewayToken.is_active == True).first()
        if gw_token:
            user = db.query(User).filter(User.id == gw_token.user_id).first()
            if user and user.is_active:
                gw_token.last_used_at = datetime.now(timezone.utc)
                db.commit()
    else:
        try:
            from jose import jwt
            from app.core.config import settings
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            user_id = payload.get("sub")
            if user_id:
                user = db.query(User).filter(User.id == int(user_id)).first()
        except Exception:
            pass
            
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Invalid or inactive API token.")
        
    return user


@router.post("/chat/completions")
async def openai_chat_completions(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Full OpenAI-compatible /v1/chat/completions endpoint for AGY, Codex, Cursor, Aider, and LangChain.
    Supports Auto-Routing, Model-Specific Prompt Booster, Self-Healing Failover, and SSE streaming.
    """
    start_time = time.time()
    user = authenticate_universal_request(request, db)
    
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")
        
    # Get configured models from database
    models = db.query(ModelConfig).all()
    enabled_models = {m.model_id for m in models if m.is_enabled}
    default_model_obj = next((m for m in models if m.is_default and m.is_enabled), None)
    default_model = default_model_obj.model_id if default_model_obj else "meta/llama-3.3-70b-instruct"
    
    import re
    raw_req_model = payload.get("model", default_model)
    req_model = re.sub(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])|\[\d+m\]?|\]|\[', '', str(raw_req_model)).strip()
    payload["model"] = req_model
    
    try:
        api_key = get_nvidia_api_key()
    except Exception as e:
        err_str = _format_error(e)
        _log_request(db, user.id, req_model, 0, 0, start_time, "error", False, err_str, request.client.host)
        raise e

    # Perform Auto-Routing
    resolved_model = resolve_model_for_request(payload, db, default_model, enabled_models)
    payload["model"] = resolved_model
    req_model = resolved_model
    
    # Inject Model-Specific Prompt Scaffolding Booster for open-weight models
    booster_instructions = ""
    if "nemotron" in resolved_model.lower():
        booster_instructions = (
            "\n\n[DRITI GATEWAY OPTIMIZATION FOR NEMOTRON]: "
            "You are an expert AI software architect and coding assistant. "
            "When writing code, prioritize clean, production-ready implementations with robust error handling. "
            "If executing tool calls or function calls, provide precise arguments. "
            "Before complex code changes, brief your architectural plan concisely."
        )
    elif "glm" in resolved_model.lower() or "gpt" in resolved_model.lower():
        booster_instructions = (
            "\n\n[DRITI GATEWAY OPTIMIZATION]: "
            "Maintain extreme technical accuracy, concise explanations, and exact adherence to tool schemas and formatting requirements."
        )

    if booster_instructions:
        messages = payload.get("messages", [])
        has_system = False
        for msg in messages:
            if msg.get("role") == "system":
                msg["content"] = str(msg.get("content", "")) + booster_instructions
                has_system = True
                break
        if not has_system:
            messages.insert(0, {"role": "system", "content": booster_instructions.strip()})
        payload["messages"] = messages

    is_streaming = payload.get("stream", False)
    
    # Build failover candidates
    candidates = [resolved_model]
    for fallback in ["nvidia/nemotron-3-super-120b-a12b", "openai/gpt-oss-120b", "z-ai/glm-5.2", "nvidia/nemotron-3-ultra-550b-a55b"]:
        if fallback in enabled_models and fallback not in candidates:
            candidates.append(fallback)

    if is_streaming:
        return StreamingResponse(
            _openai_stream_generator(payload, api_key, db, user.id, start_time, request.client.host, req_model, candidates),
            media_type="text/event-stream"
        )
    else:
        response = None
        actual_model = resolved_model
        
        for attempt_idx, candidate_model in enumerate(candidates):
            try:
                if attempt_idx > 0:
                    logger.warning(f"[OPENAI FAILOVER] Attempt {attempt_idx+1}: Model '{actual_model}' failed. Failing over to '{candidate_model}'...")
                    payload["model"] = candidate_model
                    actual_model = candidate_model
                    req_model = candidate_model
                response = await call_nvidia_chat(api_key, payload)
                break
            except Exception as e:
                logger.error(f"[OPENAI ERROR] Model '{candidate_model}' failed with: {e}")
                if attempt_idx == len(candidates) - 1:
                    err_str = _format_error(e)
                    _log_request(db, user.id, req_model, 0, 0, start_time, "error", False, err_str, request.client.host)
                    status_code = 504 if "Timeout" in err_str or "ReadTimeout" in str(type(e)) else 502
                    return JSONResponse(
                        status_code=status_code,
                        content={
                            "error": {
                                "message": f"Driti Gateway Error ({req_model}): {err_str}",
                                "type": "server_error",
                                "code": status_code
                            }
                        }
                    )
                    
        latency = int((time.time() - start_time) * 1000)
        usage = response.get("usage", {})
        prompt_tokens = usage.get("prompt_tokens", 0)
        completion_tokens = usage.get("completion_tokens", 0)
        
        _log_request(db, user.id, req_model, prompt_tokens, completion_tokens, start_time, "success", False, None, request.client.host)
        return response


async def _openai_stream_generator(payload, api_key, db, user_id, start_time, ip_address, req_model, candidates):
    """
    Streams OpenAI-compatible SSE events directly from NVIDIA NIM with failover support.
    """
    prompt_tokens = 0
    completion_tokens = 0
    success_stream = False
    
    for attempt_idx, candidate_model in enumerate(candidates):
        if attempt_idx > 0:
            logger.warning(f"[OPENAI STREAM FAILOVER] Attempt {attempt_idx+1}: Failing over to '{candidate_model}'...")
            payload["model"] = candidate_model
            req_model = candidate_model
            
        try:
            async for chunk_text in stream_nvidia_chat(api_key, payload):
                if chunk_text.startswith("data: "):
                    data_str = chunk_text[6:].strip()
                    if data_str != "[DONE]":
                        try:
                            data = json.loads(data_str)
                            if "usage" in data and data["usage"]:
                                prompt_tokens = data["usage"].get("prompt_tokens", prompt_tokens)
                                completion_tokens = data["usage"].get("completion_tokens", completion_tokens)
                        except Exception:
                            pass
                    yield chunk_text + "\n"
                    success_stream = True
            if success_stream:
                break
        except Exception as e:
            logger.error(f"[OPENAI STREAM ERROR] Model '{candidate_model}' failed: {e}")
            if success_stream or attempt_idx == len(candidates) - 1:
                err_str = _format_error(e)
                _log_request(db, user_id, req_model, 0, 0, start_time, "error", True, err_str, ip_address)
                yield f'data: {json.dumps({"error": {"message": f"Driti Gateway Error ({req_model}): {err_str}", "type": "server_error"}})}\n\n'
                yield 'data: [DONE]\n\n'
                return

    _log_request(db, user_id, req_model, prompt_tokens, completion_tokens, start_time, "success", True, None, ip_address)


@router.post("/completions")
async def openai_legacy_completions(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Legacy OpenAI /v1/completions endpoint support (for older Codex and GitHub Copilot plugins).
    Converts text completion prompt to chat completion format and delegates.
    """
    body = await request.json()
    prompt = body.pop("prompt", "")
    if isinstance(prompt, list):
        prompt = "\n\n".join([str(p) for p in prompt])
        
    body["messages"] = [{"role": "user", "content": str(prompt)}]
    
    # Create fake request object with modified JSON
    class FakeRequest:
        def __init__(self, original_req, new_body):
            self.headers = original_req.headers
            self.client = original_req.client
            self.query_params = original_req.query_params
            self._body = new_body
        async def json(self):
            return self._body

    return await openai_chat_completions(FakeRequest(request, body), db)


@router.post("/responses")
async def openai_responses(request: Request, db: Session = Depends(get_db)):
    """
    Responses API compatibility endpoint for emerging agent frameworks.
    """
    return {"status": "success", "message": "Driti Gateway Universal Responses API Ready"}
