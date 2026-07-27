from fastapi import APIRouter, Depends, Request, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.core.dependencies import get_db
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter()

@router.post("/chat/completions")
async def openai_chat_completions(request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    body = await request.json()
    # Stub translation to Anthropic/NVIDIA and return OpenAI format
    stream = body.get("stream", False)
    if stream:
        async def event_generator():
            yield 'data: {"id":"chatcmpl-xxx","object":"chat.completion.chunk","choices":[{"delta":{"content":"Mock response"},"index":0}]}\n\n'
            yield 'data: [DONE]\n\n'
        return StreamingResponse(event_generator(), media_type="text/event-stream")
    else:
        return {
            "id": "chatcmpl-xxx",
            "object": "chat.completion",
            "choices": [
                {
                    "message": {
                        "role": "assistant",
                        "content": "Mock response"
                    },
                    "finish_reason": "stop",
                    "index": 0
                }
            ],
            "usage": {
                "prompt_tokens": 0,
                "completion_tokens": 0,
                "total_tokens": 0
            }
        }

@router.post("/responses")
async def openai_responses(request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Responses API compat
    return {"status": "mock_response_api_supported"}
