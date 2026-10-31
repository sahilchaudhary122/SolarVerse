"""Alembic migration environment for SolarVerse."""

from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

from app.core.config import get_settings
from app.db.base import Base

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Future SQLAlchemy model modules must be imported before migrations are
# generated so their tables are registered in this metadata collection.
target_metadata = Base.metadata


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
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
