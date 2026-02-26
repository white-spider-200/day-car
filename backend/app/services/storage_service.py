import os
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

from app.core.config import settings

ALLOWED_CONTENT_TYPES = {"application/pdf", "image/jpeg", "image/png"}


def ensure_upload_dir() -> Path:
    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    return upload_dir


async def save_document(file: UploadFile) -> str:
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file type. Allowed: pdf, jpg, png",
        )

    upload_dir = ensure_upload_dir()
    ext = os.path.splitext(file.filename or "")[1] or ".bin"
    file_name = f"{uuid.uuid4()}{ext.lower()}"
    full_path = upload_dir / file_name

    max_size = settings.max_upload_mb * 1024 * 1024
    total_size = 0

    with full_path.open("wb") as out:
        while True:
            chunk = await file.read(1024 * 1024)
            if not chunk:
                break
            total_size += len(chunk)
            if total_size > max_size:
                out.close()
                full_path.unlink(missing_ok=True)
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"File too large. Max {settings.max_upload_mb}MB",
                )
            out.write(chunk)

    return f"{settings.upload_base_url}/{file_name}"
