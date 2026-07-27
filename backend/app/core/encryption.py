import base64
import hashlib
from cryptography.fernet import Fernet
from app.core.config import settings

def _get_fernet_key(secret: str) -> bytes:
    # Derive a 32-byte key from the secret key using SHA-256
    hash_bytes = hashlib.sha256(secret.encode('utf-8')).digest()
    return base64.urlsafe_b64encode(hash_bytes)

fernet = Fernet(_get_fernet_key(settings.SECRET_KEY))

def encrypt(data: str) -> str:
    if not data:
        return data
    return fernet.encrypt(data.encode('utf-8')).decode('utf-8')

def decrypt(data: str) -> str:
    if not data:
        return data
    try:
        return fernet.decrypt(data.encode('utf-8')).decode('utf-8')
    except Exception:
        return ""
