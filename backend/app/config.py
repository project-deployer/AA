"""Application configuration."""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    database_url: str = "sqlite:///./agriai.db"
    firebase_project_id: str = ""
    google_application_credentials: str | None = None
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    env: str = "development"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
