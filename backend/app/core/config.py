"""Centralized settings for the SolarVerse backend."""

from functools import lru_cache
from pydantic import Field, model_validator
from sqlalchemy.engine import make_url

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables when provided."""

    application_name: str = "SolarVerse"
    api_v1_prefix: str = "/api/v1"
    debug: bool = False
    environment: str = "development"
    cors_origins: list[str] = Field(default_factory=list)
    database_url: str = "postgresql+psycopg://localhost/solarverse_dev"
    secret_key: str = "solarverse-secure-jwt-secret-key-change-in-prod"
    jwt_algorithm: str = "HS256"
    jwt_issuer: str | None = None
    jwt_audience: str | None = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @model_validator(mode="after")
    def validate_production_secrets(self) -> "Settings":
        if self.environment.lower() == "production":
            if self.secret_key == "solarverse-secure-jwt-secret-key-change-in-prod" or len(self.secret_key) < 32:
                raise ValueError("A strong SECRET_KEY of at least 32 characters is required in production")
            if self.database_url.startswith("postgresql+psycopg://localhost"):
                raise ValueError("DATABASE_URL must point to the configured production PostgreSQL database")
            if make_url(self.database_url).query.get("sslmode") not in {"require", "verify-ca", "verify-full"}:
                raise ValueError("DATABASE_URL must require PostgreSQL SSL in production")
            if not self.cors_origins:
                raise ValueError("CORS_ORIGINS must contain the production frontend origin")
            if not self.jwt_issuer or not self.jwt_audience:
                raise ValueError("JWT_ISSUER and JWT_AUDIENCE are required in production")
        return self


@lru_cache
def get_settings() -> Settings:
    """Return the cached application settings instance."""

    return Settings()
