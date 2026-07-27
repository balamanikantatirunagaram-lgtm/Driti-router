import httpx
import json
from typing import AsyncGenerator, Dict, Any, Optional
from app.core.encryption import decrypt
from app.db.session import SessionLocal
from app.models.settings import AppSettings
from fastapi import HTTPException

NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1"

def get_nvidia_api_key() -> str:
    db = SessionLocal()
    try:
        settings_row = db.query(AppSettings).filter(AppSettings.id == 1).first()
        if not settings_row or not settings_row.nvidia_api_key_encrypted:
            raise HTTPException(status_code=500, detail="NVIDIA API key not configured")
        key = decrypt(settings_row.nvidia_api_key_encrypted)
        if not key:
            raise HTTPException(status_code=500, detail="Invalid NVIDIA API key encryption")
        return key
    finally:
        db.close()

async def test_nvidia_connection(api_key: str) -> bool:
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{NVIDIA_API_URL}/models",
                headers={"Authorization": f"Bearer {api_key}"}
            )
            return response.status_code == 200
    except Exception:
        return False

async def fetch_nvidia_models(api_key: str) -> list:
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(
            f"{NVIDIA_API_URL}/models",
            headers={"Authorization": f"Bearer {api_key}"}
        )
        response.raise_for_status()
        return response.json().get("data", [])

async def stream_nvidia_chat(api_key: str, payload: Dict[str, Any]) -> AsyncGenerator[str, None]:
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    timeout_config = httpx.Timeout(connect=30.0, read=600.0, write=60.0, pool=30.0)
    async with httpx.AsyncClient(timeout=timeout_config) as client:
        async with client.stream("POST", f"{NVIDIA_API_URL}/chat/completions", headers=headers, json=payload) as response:
            if response.status_code != 200:
                body = await response.aread()
                raise HTTPException(status_code=response.status_code, detail=f"NVIDIA API Error: {body.decode()}")
            
            async for chunk in response.aiter_text():
                yield chunk

async def call_nvidia_chat(api_key: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    timeout_config = httpx.Timeout(connect=30.0, read=600.0, write=60.0, pool=30.0)
    async with httpx.AsyncClient(timeout=timeout_config) as client:
        response = await client.post(f"{NVIDIA_API_URL}/chat/completions", headers=headers, json=payload)
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=f"NVIDIA API Error: {response.text}")
        return response.json()
