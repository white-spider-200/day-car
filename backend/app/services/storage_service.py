import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

from app.core.config import settings

DOCUMENT_CONTENT_TYPES = {"application/pdf", "image/jpeg", "image/png"}
PHOTO_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
LICENSE_CONTENT_TYPES = {"application/pdf", "image/jpeg", "image/png", "image/webp"}
CONTENT_TYPE_TO_EXTENSION = {
    "application/pdf": ".pdf",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


def ensure_upload_dir() -> Path:
    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    return upload_dir


async def save_uploaded_file(file: UploadFile, *, allowed_content_types: set[str], label: str) -> str:
    if file.content_type not in allowed_content_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported {label} file type.",
        )

    upload_dir = ensure_upload_dir()
    extension = CONTENT_TYPE_TO_EXTENSION.get(file.content_type or "", ".bin")
    file_name = f"{uuid.uuid4()}{extension}"
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


async def save_document(file: UploadFile) -> str:
    return await save_uploaded_file(file, allowed_content_types=DOCUMENT_CONTENT_TYPES, label="document")


async def save_application_photo(file: UploadFile) -> str:
    return await save_uploaded_file(file, allowed_content_types=PHOTO_CONTENT_TYPES, label="photo")


async def save_license_document(file: UploadFile) -> str:
    return await save_uploaded_file(file, allowed_content_types=LICENSE_CONTENT_TYPES, label="license")
