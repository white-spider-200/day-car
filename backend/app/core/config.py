from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "doctrs-sabina-api"
    database_url: str = "postgresql+psycopg://postgres:postgres@postgres:5432/doctrs"
    jwt_secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60

    upload_dir: str = "uploads"
    upload_base_url: str = "/uploads"
    max_upload_mb: int = 10

    auth_rate_limit_window_seconds: int = 60
    auth_rate_limit_max_requests: int = 20

    seed_admin_email: str = "admin@sabina.local"
    seed_admin_password: str = "Admin12345!"

    cors_origins: list[str] = Field(default_factory=lambda: ["*"])


settings = Settings()
