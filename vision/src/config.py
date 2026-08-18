from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Config(BaseSettings):
    """Configuración del módulo de visión desde variables de entorno / .env."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    vision_source: str = "samples/video_demo.mp4"
    vision_samples_dir: str = "../vision/samples"
    vision_conf_threshold: float = 0.25
    vision_fps_sample: int = 1
    vision_classes: str = "19,17,18"
    vision_loop: bool = False

    backend_url: str = "http://localhost:8000"
    backend_ingest_path: str = "/api/v1/eventos/ingest"

    vision_port: int = 8002


@lru_cache
def get_config() -> Config:
    return Config()