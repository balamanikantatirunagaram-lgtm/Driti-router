import json
import json_repair
import time
from fastapi import APIRouter, Depends, Request, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_user
from app.models.model_config import ModelConfig
from app.models.request_log import RequestLog
from app.models.user import User
from app.services.nvidia import get_nvidia_api_key, call_nvidia_chat, stream_nvidia_chat
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/models")
def get_anthropic_models(db: Session = Depends(get_db)):
    models = db.query(ModelConfig).filter(ModelConfig.is_enabled == True).all()
    anthropic_models = []
    
    # Universal model aliases for Claude Code, Codex, AGY, Cursor, and Aider compatibility
    universal_aliases = [
        # Anthropic / Claude Code
        ("claude-3-5-sonnet-20241022", "Claude 3.5 Sonnet", "anthropic"),
        ("claude-3-5-sonnet-latest", "Claude 3.5 Sonnet (Latest)", "anthropic"),
        ("claude-3-opus-20240229", "Claude 3 Opus", "anthropic"),
        ("claude-3-opus-latest", "Claude 3 Opus (Latest)", "anthropic"),
        ("claude-3-5-haiku-20241022", "Claude 3.5 Haiku", "anthropic"),
        ("claude-3-5-haiku-latest", "Claude 3.5 Haiku (Latest)", "anthropic"),
        ("claude-3-haiku-20240307", "Claude 3 Haiku", "anthropic"),
        ("claude-opus-5", "Claude Opus 5", "anthropic"),
        ("claude-sonnet-5", "Claude Sonnet 5", "anthropic"),
        ("claude-3-7-sonnet-20250219", "Claude 3.7 Sonnet", "anthropic"),
        ("claude-3-7-sonnet-latest", "Claude 3.7 Sonnet (Latest)", "anthropic"),
        # OpenAI / Codex / Cursor / Aider
        ("gpt-4o", "GPT-4o", "openai"),
        ("gpt-4o-mini", "GPT-4o Mini", "openai"),
        ("gpt-4o-2024-05-13", "GPT-4o (2024-05-13)", "openai"),
        ("gpt-4", "GPT-4", "openai"),
        ("gpt-4-turbo", "GPT-4 Turbo", "openai"),
        ("gpt-3.5-turbo", "GPT-3.5 Turbo", "openai"),
        ("codex", "OpenAI Codex", "openai"),
        ("code-davinci-002", "Code Davinci 002", "openai"),
        ("o1", "OpenAI o1", "openai"),
        ("o1-preview", "OpenAI o1 Preview", "openai"),
        ("o1-mini", "OpenAI o1 Mini", "openai"),
        ("o3-mini", "OpenAI o3 Mini", "openai"),
        # Google / Gemini / AGY (Antigravity CLI / SDK)
        ("gemini-1.5-pro", "Gemini 1.5 Pro", "google"),
        ("gemini-1.5-flash", "Gemini 1.5 Flash", "google"),
        ("gemini-2.0-flash-exp", "Gemini 2.0 Flash Exp", "google"),
        ("gemini-2.5-pro", "Gemini 2.5 Pro", "google"),
        ("gemini-2.5-flash", "Gemini 2.5 Flash", "google"),
        ("gemini-pro", "Gemini Pro", "google"),
        ("antigravity", "Google Antigravity Engine", "google"),
        ("agy", "AGY Default Engine", "google"),
    ]
    now_iso = datetime.now(timezone.utc).isoformat()
    for alias_id, alias_name, owner in universal_aliases:
        anthropic_models.append({
            "id": alias_id,
            "type": "model",
            "object": "model",
            "owned_by": owner,
            "created_at": now_iso,
            "display_name": f"{alias_name} (Routes to NVIDIA)"
        })

    for m in models:
        anthropic_models.append({
            "id": m.model_id,
            "type": "model",
            "object": "model",
            "owned_by": "driti-gateway",
            "created_at": m.updated_at.isoformat(),
            "display_name": m.display_name
        })
    return {"data": anthropic_models, "object": "list"}

def resolve_model_for_request(payload: dict, db: Session, default_model: str, enabled_models: set) -> str:
    prompt_parts = []
    if "system" in payload and payload["system"]:
        prompt_parts.append(str(payload["system"]))
    for msg in payload.get("messages", []):
        content = msg.get("content", "")
        if isinstance(content, list):
            text_parts = [part.get("text", "") for part in content if isinstance(part, dict) and part.get("type") == "text"]
            prompt_parts.append(" ".join(text_parts))
        else:
            prompt_parts.append(str(content))
    full_prompt = " ".join(prompt_parts).lower()
    prompt_len = len(full_prompt)
    
    heavy_keywords = ["code", "function", "script", "architect", "sql", "redis", "typescript", "python", "react", "fastapi", "docker", "kubernetes", "debug", "error", "algorithm", "database", "class", "async", "schema", "distributed", "test", "build"]
    massive_keywords = ["100,000", "multi-region", "concurrency", "token-bucket", "enterprise", "system design", "benchmark", "production-ready", "high-throughput", "fault-tolerant", "550b", "ultra"]
    
    has_massive = any(k in full_prompt for k in massive_keywords) or prompt_len > 1500
    has_heavy = any(k in full_prompt for k in heavy_keywords) or prompt_len > 400
    
    # Assign model according to usage and task
    if has_massive:
        logger.info("[AUTO ROUTER] Massive complexity detected -> routing to: nvidia/nemotron-3-ultra-550b-a55b")
        return "nvidia/nemotron-3-ultra-550b-a55b"
    elif has_heavy:
        logger.info("[AUTO ROUTER] Heavy coding/reasoning detected -> routing to: nvidia/nemotron-3-super-120b-a12b")
        return "nvidia/nemotron-3-super-120b-a12b"
    elif prompt_len > 150:
        logger.info("[AUTO ROUTER] Analytical instruction detected -> routing to: openai/gpt-oss-120b")
        return "openai/gpt-oss-120b"
    else:
        logger.info("[AUTO ROUTER] General chat detected -> routing to: z-ai/glm-5.2")
        return "z-ai/glm-5.2"

async def anthropic_to_openai_payload(payload: dict, default_model: str, enabled_models: set = None) -> dict:
    import re
    raw_model_id = payload.get("model", default_model)
    model_id = re.sub(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])|\[\d+m\]?|\]|\[', '', str(raw_model_id)).strip()
    
    if not enabled_models:
        enabled_models = set()
        
    if model_id not in enabled_models:
        logger.info(f"Mapping requested model '{model_id}' to configured model '{default_model}'")
        model_id = default_model
    
    booster_instructions = (
        "\n\n[ANTHROPIC CLAUDE SONNET SIMULATION SCAFFOLDING]:\n"
        "1. TOOL INVARIANT: You are simulating Anthropic Claude 3.5 Sonnet inside the official Claude Code CLI engine. When creating, updating, or editing files, you MUST invoke file manipulation tools directly. NEVER generate standalone markdown code blocks (e.g. ```typescript) as a substitute for editing files. NEVER use cat, echo, or sed in bash commands to modify files.\n"
        "2. SILENT EXECUTION: Execute tool calls immediately and silently. Do NOT output conversational preambles (e.g. 'I will now edit index.ts' or 'Here is the fix:') before invoking tools.\n"
        "3. ERROR RECOVERY: If a tool or compiler returns an error, analyze the error and invoke the correcting tool immediately without panicking or looping."
    )

    openai_messages = []
    if "system" in payload and payload["system"]:
        sys_val = payload["system"]
        if isinstance(sys_val, list):
            sys_val = " ".join([p.get("text", "") for p in sys_val if isinstance(p, dict) and p.get("type") == "text"])
        openai_messages.append({"role": "system", "content": str(sys_val) + booster_instructions})
    elif booster_instructions:
        openai_messages.append({"role": "system", "content": booster_instructions.strip()})
        
    for msg in payload.get("messages", []):
        role = msg.get("role")
        content = msg.get("content")
        
        if isinstance(content, str):
            openai_messages.append({"role": role, "content": content})
        elif isinstance(content, list):
            text_parts = []
            tool_calls = []
            tool_results = []
            
            for part in content:
                if isinstance(part, dict):
                    ptype = part.get("type")
                    if ptype == "text":
                        text_parts.append(part.get("text", ""))
                    elif ptype == "tool_use":
                        tool_calls.append({
                            "id": part.get("id", f"call_{len(tool_calls)}"),
                            "type": "function",
                            "function": {
                                "name": part.get("name"),
                                "arguments": json.dumps(part.get("input", {}))
                            }
                        })
                    elif ptype == "tool_result":
                        res_content = part.get("content", "")
                        if isinstance(res_content, list):
                            res_content = " ".join([p.get("text", "") for p in res_content if isinstance(p, dict) and p.get("type") == "text"])
                        tool_results.append({
                            "tool_call_id": part.get("tool_use_id", ""),
                            "content": str(res_content)
                        })
                elif isinstance(part, str):
                    text_parts.append(part)
                    
            if role == "assistant":
                msg_dict = {"role": "assistant"}
                if text_parts:
                    msg_dict["content"] = " ".join(text_parts)
                else:
                    msg_dict["content"] = None
                if tool_calls:
                    msg_dict["tool_calls"] = tool_calls
                openai_messages.append(msg_dict)
            elif role == "user":
                if text_parts:
                    openai_messages.append({"role": "user", "content": " ".join(text_parts)})
                for tr in tool_results:
                    openai_messages.append({
                        "role": "tool",
                        "tool_call_id": tr["tool_call_id"],
                        "content": tr["content"]
                    })
            else:
                openai_messages.append({"role": role, "content": " ".join(text_parts)})
        
    mapped_payload = {
        "model": model_id,
        "messages": openai_messages,
        "max_tokens": payload.get("max_tokens", 4096),
        "temperature": payload.get("temperature", 1.0),
        "stream": payload.get("stream", False)
    }
    
    if "tools" in payload and payload["tools"]:
        openai_tools = []
        for t in payload["tools"]:
            openai_tools.append({
                "type": "function",
                "function": {
                    "name": t["name"],
                    "description": t.get("description", ""),
                    "parameters": t.get("input_schema", {"type": "object", "properties": {}})
                }
            })
        mapped_payload["tools"] = openai_tools
        
        if "tool_choice" in payload and isinstance(payload["tool_choice"], dict):
            tc = payload["tool_choice"]
            if tc.get("type") == "tool" and "name" in tc:
                mapped_payload["tool_choice"] = {"type": "function", "function": {"name": tc["name"]}}
            elif tc.get("type") == "any":
                mapped_payload["tool_choice"] = "auto"
            elif tc.get("type") == "auto":
                mapped_payload["tool_choice"] = "auto"
                
    return mapped_payload


@router.post("/messages")
async def create_message(
    request: Request,
    db: Session = Depends(get_db)
):
    from app.api.openai_compat import authenticate_universal_request
    user = authenticate_universal_request(request, db)

    payload = await request.json()
    start_time = time.time()
    
    default_model_row = db.query(ModelConfig).filter(ModelConfig.is_default == True, ModelConfig.is_enabled == True).first()
    if not default_model_row:
        default_model_row = db.query(ModelConfig).filter(ModelConfig.is_enabled == True).first()
    default_model = default_model_row.model_id if default_model_row else "nvidia/nemotron-3-super-120b-a12b"
    
    enabled_models = {m[0] for m in db.query(ModelConfig.model_id).filter(ModelConfig.is_enabled == True).all()}
    
    is_streaming = payload.get("stream", False)
    import re
    raw_req_model = payload.get("model", default_model)
    req_model = re.sub(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])|\[\d+m\]?|\]|\[', '', str(raw_req_model)).strip()
    payload["model"] = req_model
    
    try:
        api_key = get_nvidia_api_key()
    except Exception as e:
        err_str = _format_error(e) if '_format_error' in globals() else str(e)
        _log_request(db, user.id, req_model, 0, 0, start_time, "error", is_streaming, err_str, request.client.host)
        raise e

    resolved_model = resolve_model_for_request(payload, db, default_model, enabled_models)
    payload["model"] = resolved_model
    req_model = resolved_model

    mapped_payload = await anthropic_to_openai_payload(payload, resolved_model, enabled_models)
    
    if is_streaming:
        return StreamingResponse(
            _stream_generator(mapped_payload, api_key, db, user.id, start_time, request.client.host, req_model, enabled_models),
            media_type="text/event-stream"
        )
    else:
        try:
            candidates = [req_model]
            for fallback in ["nvidia/nemotron-3-super-120b-a12b", "nvidia/nemotron-3-ultra-550b-a55b", "openai/gpt-oss-120b", "z-ai/glm-5.2"]:
                if fallback in enabled_models and fallback not in candidates:
                    candidates.append(fallback)
                    
            response = None
            actual_model = req_model
            
            for attempt_idx, candidate_model in enumerate(candidates):
                try:
                    if attempt_idx > 0:
                        logger.warning(f"[FAILOVER RETRY] Attempt {attempt_idx+1}: Model '{actual_model}' failed. Failing over to '{candidate_model}'...")
                        mapped_payload["model"] = candidate_model
                        actual_model = candidate_model
                        req_model = candidate_model
                    response = await call_nvidia_chat(api_key, mapped_payload)
                    break
                except Exception as e:
                    logger.error(f"[FAILOVER ERROR] Model '{candidate_model}' failed with: {e}")
                    if attempt_idx == len(candidates) - 1:
                        raise e

            latency = int((time.time() - start_time) * 1000)
            
            usage = response.get("usage", {})
            prompt_tokens = usage.get("prompt_tokens", 0)
            completion_tokens = usage.get("completion_tokens", 0)
            
            msg_obj = response["choices"][0]["message"]
            content_text = msg_obj.get("content")
            tool_calls = msg_obj.get("tool_calls")
            
            anthropic_content = []
            if content_text and not tool_calls:
                anthropic_content.append({"type": "text", "text": content_text})
            
            if tool_calls:
                for tc in tool_calls:
                    fn = tc.get("function", {})
                    try:
                        raw_args = fn.get("arguments", "{}")
                        repaired_args = json_repair.repair_json(raw_args, return_objects=True)
                        args = repaired_args if isinstance(repaired_args, dict) else {}
                    except Exception:
                        args = {}
                    anthropic_content.append({
                        "type": "tool_use",
                        "id": tc.get("id", f"toolu_{int(time.time()*1000)}"),
                        "name": fn.get("name"),
                        "input": args
                    })
            if not anthropic_content:
                anthropic_content.append({"type": "text", "text": ""})
                
            finish_reason = response["choices"][0].get("finish_reason", "end_turn")
            stop_reason = "tool_use" if (tool_calls or finish_reason == "tool_calls") else ("end_turn" if finish_reason == "stop" else (finish_reason or "end_turn"))

            anthropic_response = {
                "id": response.get("id", "msg_default"),
                "type": "message",
                "role": "assistant",
                "content": anthropic_content,
                "model": req_model,
                "stop_reason": stop_reason,
                "stop_sequence": None,
                "usage": {
                    "input_tokens": prompt_tokens,
                    "output_tokens": completion_tokens
                }
            }
            
            _log_request(db, user.id, req_model, prompt_tokens, completion_tokens, start_time, "success", False, None, request.client.host)
            return anthropic_response
        except Exception as e:
            err_str = _format_error(e)
            _log_request(db, user.id, req_model, 0, 0, start_time, "error", False, err_str, request.client.host)
            status_code = 504 if "Timeout" in err_str or "ReadTimeout" in str(type(e)) else 502
            from fastapi.responses import JSONResponse
            return JSONResponse(
                status_code=status_code,
                content={
                    "type": "error",
                    "error": {
                        "type": "timeout_error" if status_code == 504 else "api_error",
                        "message": f"Driti Gateway Error ({req_model}): {err_str}"
                    }
                }
            )

def _format_error(e: Exception) -> str:
    msg = str(e).strip()
    if not msg or msg == "":
        msg = f"{type(e).__name__}: Request timed out or connection closed unexpectedly."
    return msg

async def _stream_generator(mapped_payload, api_key, db, user_id, start_time, ip_address, original_req_model=None, enabled_models=None):
    req_model = original_req_model or mapped_payload["model"]
    try:
        # Send message_start
        yield f"event: message_start\ndata: {json.dumps({'type': 'message_start', 'message': {'id': 'msg_1', 'type': 'message', 'role': 'assistant', 'model': req_model, 'content': [], 'stop_reason': None, 'stop_sequence': None, 'usage': {'input_tokens': 0, 'output_tokens': 0}}})}\n\n"
        
        prompt_tokens = 0
        completion_tokens = 0
        
        block_index = 0
        text_started = False
        tool_blocks = {}
        finish_reason = None
        
        candidates = [req_model]
        if enabled_models:
            for fallback in ["nvidia/nemotron-3-super-120b-a12b", "nvidia/nemotron-3-ultra-550b-a55b", "openai/gpt-oss-120b", "z-ai/glm-5.2"]:
                if fallback in enabled_models and fallback not in candidates:
                    candidates.append(fallback)
                    
        success_stream = False
        
        for attempt_idx, candidate_model in enumerate(candidates):
            if attempt_idx > 0:
                logger.warning(f"[STREAM FAILOVER] Attempt {attempt_idx+1}: Failing over to '{candidate_model}'...")
                mapped_payload["model"] = candidate_model
                req_model = candidate_model
                
            try:
                async for chunk_text in stream_nvidia_chat(api_key, mapped_payload):
                    if chunk_text.startswith("data: "):
                        try:
                            data_str = chunk_text[6:].strip()
                            if data_str == "[DONE]":
                                continue
                            
                            data = json.loads(data_str)
                            if "usage" in data and data["usage"]:
                                prompt_tokens = data["usage"].get("prompt_tokens", prompt_tokens)
                                completion_tokens = data["usage"].get("completion_tokens", completion_tokens)
                                
                            choice = data["choices"][0]
                            if choice.get("finish_reason"):
                                finish_reason = choice.get("finish_reason")
                                
                            delta = choice.get("delta", {})
                            content = delta.get("content", "")
                            tool_calls = delta.get("tool_calls", [])
                            
                            if content and not (tool_blocks or tool_calls):
                                if not text_started:
                                    yield f"event: content_block_start\ndata: {json.dumps({'type': 'content_block_start', 'index': block_index, 'content_block': {'type': 'text', 'text': ''}})}\n\n"
                                    text_started = True
                                yield f"event: content_block_delta\ndata: {json.dumps({'type': 'content_block_delta', 'index': block_index, 'delta': {'type': 'text_delta', 'text': content}})}\n\n"
                                success_stream = True
                                
                            for tc in tool_calls:
                                tc_idx = tc.get("index", 0)
                                if text_started:
                                    yield f"event: content_block_stop\ndata: {json.dumps({'type': 'content_block_stop', 'index': block_index})}\n\n"
                                    text_started = False
                                    block_index += 1
                                    
                                target_block_idx = block_index + tc_idx
                                if target_block_idx not in tool_blocks:
                                    fn = tc.get("function", {})
                                    t_id = tc.get("id", f"toolu_{int(time.time()*1000)}_{target_block_idx}")
                                    t_name = fn.get("name", "unknown_tool")
                                    tool_blocks[target_block_idx] = {"id": t_id, "name": t_name, "args": ""}
                                    yield f"event: content_block_start\ndata: {json.dumps({'type': 'content_block_start', 'index': target_block_idx, 'content_block': {'type': 'tool_use', 'id': t_id, 'name': t_name, 'input': {}}})}\n\n"
                                    
                                fn = tc.get("function", {})
                                args_delta = fn.get("arguments", "")
                                if args_delta:
                                    tool_blocks[target_block_idx]["args"] = tool_blocks[target_block_idx].get("args", "") + args_delta
                                    yield f"event: content_block_delta\ndata: {json.dumps({'type': 'content_block_delta', 'index': target_block_idx, 'delta': {'type': 'input_json_delta', 'partial_json': args_delta}})}\n\n"
                                success_stream = True
                                    
                        except Exception as e:
                            logger.error(f"Error parsing chunk: {e}")
                if success_stream or not (not text_started and not tool_blocks):
                    break # Stream connected and executed!
            except Exception as e:
                logger.error(f"[STREAM ERROR] Model '{candidate_model}' failed: {e}")
                if success_stream or attempt_idx == len(candidates) - 1:
                    raise e
                    
        if not text_started and not tool_blocks:
            yield f"event: content_block_start\ndata: {json.dumps({'type': 'content_block_start', 'index': 0, 'content_block': {'type': 'text', 'text': ''}})}\n\n"
            yield f"event: content_block_stop\ndata: {json.dumps({'type': 'content_block_stop', 'index': 0})}\n\n"
        else:
            if text_started:
                yield f"event: content_block_stop\ndata: {json.dumps({'type': 'content_block_stop', 'index': block_index})}\n\n"
            for t_idx in sorted(tool_blocks.keys()):
                raw_args = tool_blocks[t_idx].get("args", "")
                if raw_args:
                    try:
                        json.loads(raw_args)
                    except Exception:
                        try:
                            repaired = json_repair.repair_json(raw_args)
                            if len(repaired) > len(raw_args):
                                missing_suffix = repaired[len(raw_args):]
                                yield f"event: content_block_delta\ndata: {json.dumps({'type': 'content_block_delta', 'index': t_idx, 'delta': {'type': 'input_json_delta', 'partial_json': missing_suffix}})}\n\n"
                        except Exception:
                            pass
                yield f"event: content_block_stop\ndata: {json.dumps({'type': 'content_block_stop', 'index': t_idx})}\n\n"
                
        stop_reason = "tool_use" if (tool_blocks or finish_reason == "tool_calls") else ("end_turn" if finish_reason == "stop" else (finish_reason or "end_turn"))
        yield f"event: message_delta\ndata: {json.dumps({'type': 'message_delta', 'delta': {'stop_reason': stop_reason, 'stop_sequence': None}, 'usage': {'output_tokens': completion_tokens}})}\n\n"
        yield f"event: message_stop\ndata: {json.dumps({'type': 'message_stop'})}\n\n"
        
        _log_request(db, user_id, req_model, prompt_tokens, completion_tokens, start_time, "success", True, None, ip_address)
    except Exception as e:
        err_str = _format_error(e)
        _log_request(db, user_id, req_model, 0, 0, start_time, "error", True, err_str, ip_address)
        yield f"event: error\ndata: {json.dumps({'type': 'error', 'error': {'type': 'timeout_error' if 'Timeout' in err_str else 'api_error', 'message': f'Driti Gateway Error ({req_model}): {err_str}'}})}\n\n"

def _log_request(db, user_id, model, prompt_tokens, completion_tokens, start_time, status, is_streaming, error_message, ip_address):
    try:
        latency = int((time.time() - start_time) * 1000)
        log_entry = RequestLog(
            timestamp=datetime.now(timezone.utc),
            user_id=user_id,
            model=model,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=prompt_tokens + completion_tokens,
            latency_ms=latency,
            status=status,
            is_streaming=is_streaming,
            error_message=error_message,
            ip_address=ip_address
        )
        db.add(log_entry)
        db.commit()
    except Exception as e:
        logger.error(f"Failed to log request: {e}")
        db.rollback()
