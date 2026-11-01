"""One-time local administrator bootstrap for solarverse_workflow_test only."""

from getpass import getpass
import re

from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import Session

from app.api.v1.auth import get_password_hash
from app.core.config import get_settings
from app.models.canonical import MODEL_CLASSES

AppUser = MODEL_CLASSES["app_user"]
ALLOWED_DATABASE = "solarverse_workflow_test"
LOCAL_HOSTS = {None, "", "localhost", "127.0.0.1", "::1"}


def main() -> int:
    settings = get_settings()
    url = make_url(settings.database_url)
    if settings.environment.lower() != "development" or url.host not in LOCAL_HOSTS:
        raise SystemExit("Bootstrap is restricted to a local development PostgreSQL instance")
    if url.database != ALLOWED_DATABASE:
        raise SystemExit(f"Bootstrap URL must name {ALLOWED_DATABASE!r}; no connection was opened")
    if len(settings.secret_key) < 32 or settings.secret_key == "solarverse-secure-jwt-secret-key-change-in-prod" or "replace-with-" in settings.secret_key:
        raise SystemExit("Configure a random local SECRET_KEY of at least 32 characters before bootstrap")

    display_name = input("Administrator display name: ").strip()
    email = input("Administrator email: ").strip().lower()
    if not display_name or len(display_name) > 160 or not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email):
        raise SystemExit("A display name and valid email are required")
    password = getpass("Strong administrator password (16+ characters): ")
    confirmation = getpass("Confirm password: ")
    if password != confirmation or len(password) < 16 or not any(c.isalpha() for c in password) or not any(c.isdigit() for c in password):
        raise SystemExit("Password confirmation failed or password is too weak")

    engine = create_engine(url)
    try:
        with engine.begin() as connection:
            database = connection.execute(text("SELECT current_database()")).scalar_one()
            if database != ALLOWED_DATABASE:
                raise SystemExit(f"Refusing database {database!r}; expected {ALLOWED_DATABASE!r}")
            with Session(bind=connection) as session:
                if session.query(AppUser.id).filter_by(role="system_admin").first() is not None:
                    raise SystemExit("An administrator already exists; bootstrap is one-time only")
                if session.query(AppUser.id).filter_by(email_normalized=email).first() is not None:
                    raise SystemExit("That email is already registered")
                session.add(AppUser(
                    display_name=display_name,
                    email_normalized=email,
                    password_hash=get_password_hash(password),
                    role="system_admin",
                    is_active=True,
                ))
                session.flush()
                session.commit()
        print(f"Created local system administrator {email} in {ALLOWED_DATABASE}.")
        return 0
    finally:
        engine.dispose()


if __name__ == "__main__":
    raise SystemExit(main())
