"""Alembic migration environment for SolarVerse."""

from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool, text

from app.core.config import get_settings
from app.db.base import Base
from app import models  # noqa: F401

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Future SQLAlchemy model modules must be imported before migrations are
# generated so their tables are registered in this metadata collection.
target_metadata = Base.metadata


def include_object(object_: object, name: str | None, type_: str, reflected: bool, compare_to: object | None) -> bool:
    """Ignore Alembic's own bookkeeping table during model/schema comparison."""

    return not (type_ == "table" and name == "alembic_version")


def configure_database_url() -> None:
    """Load the database URL from the existing application settings."""

    config.set_main_option(
        "sqlalchemy.url",
        get_settings().database_url.replace("%", "%%"),
    )


def run_migrations_offline() -> None:
    """Run migrations without creating a database engine."""

    configure_database_url()
    context.configure(
        url=config.get_main_option("sqlalchemy.url"),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        version_table_schema="public",
        include_schemas=True,
        include_object=include_object,
    )

    # Alembic defaults this column to VARCHAR(32), but the immutable revision
    # id 005_survey_enquiry_site_integrity is longer. Emit a wider table before
    # the revision runner attempts to record it.
    context.execute(
        "CREATE TABLE IF NOT EXISTS public.alembic_version "
        "(version_num VARCHAR(128) NOT NULL, "
        "CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num))"
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations using a connection created from application settings."""

    configure_database_url()
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        if connection.dialect.name == "postgresql":
            # Preserve the immutable revision history while allowing its long
            # revision identifiers to be stored. Widening is data preserving.
            with connection.begin():
                connection.execute(
                    text(
                        "CREATE TABLE IF NOT EXISTS public.alembic_version "
                        "(version_num VARCHAR(128) NOT NULL, "
                        "CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num))"
                    )
                )
                connection.execute(
                    text(
                        "ALTER TABLE public.alembic_version "
                        "ALTER COLUMN version_num TYPE VARCHAR(128)"
                    )
                )

        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            version_table_schema="public",
            include_schemas=True,
            include_object=include_object,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
