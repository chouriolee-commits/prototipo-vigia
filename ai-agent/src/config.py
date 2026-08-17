from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Config(BaseSettings):
    """Configuración del agente IA desde variables de entorno / .env."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    ai_agent_port: int = 8001
    groq_api_key: str = ""
    groq_model: str = "openai/gpt-oss-20b"
    groq_max_tokens: int = 512
    groq_temperature: float = 0.3
    ai_request_timeout: float = 10.0


@lru_cache
def get_config() -> Config:
    return Config()