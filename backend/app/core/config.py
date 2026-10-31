"""Centralized settings for the SolarVerse backend."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables when provided."""

    application_name: str = "SolarVerse"
    api_v1_prefix: str = "/api/v1"
    debug: bool = False
    database_url: str = "postgresql+psycopg://localhost/solarverse_dev"
    secret_key: str = "solarverse-secure-jwt-secret-key-change-in-prod"
    jwt_algorithm: str = "HS256"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    """Return the cached application settings instance."""

    return Settings()
