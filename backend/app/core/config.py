from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuración del backend desde variables de entorno / .env."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "VIGÍA Backend"
    version: str = "1.0.0"

    mysql_host: str = "localhost"
    mysql_port: int = 3306
    mysql_user: str = "vigia"
    mysql_password: str = "vigia"
    mysql_database: str = "vigia_db"

    api_key: str = "dev-api-key"

    auth_email: str = "admin@vigia.co"
    auth_password_hash: str = ""
    auth_password: str = "Vigia123!"
    secret_key: str = "dev-secret-key-vigia-cambiar-en-produccion-32-bytes-min"
    token_expire_minutes: int = 60

    ai_agent_url: str = "http://localhost:8001"
    ai_agent_timeout: float = 10.0

    n8n_webhook_url: str = "http://localhost:5678/webhook/vigia-alerta"
    n8n_enabled: bool = False

    vision_source: str = "samples/video_demo.mp4"
    vision_samples_dir: str = "../vision/samples"


@lru_cache
def get_settings() -> Settings:
    return Settings()