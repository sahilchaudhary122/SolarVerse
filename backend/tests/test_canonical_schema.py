"""Canonical v1.2 metadata checks and isolated PostgreSQL integration tests."""

from __future__ import annotations

import os
from uuid import uuid4

import pytest
from alembic.config import Config
from alembic.migration import MigrationContext
from alembic.script import ScriptDirectory
from sqlalchemy import CheckConstraint, UniqueConstraint, inspect, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.engine import Connection, Engine
from sqlalchemy.orm import configure_mappers

from app.db.base import Base
from app.db.session import create_database_engine
from app.models.canonical import MODEL_CLASSES, TABLES

EXPECTED_HEAD = "006_canonical_v12_schema"
EXPECTED_DATABASE = "solarverse_migration_test"


def test_canonical_models_are_registered_and_relationships_configure() -> None:
    configure_mappers()
    assert len(TABLES) == 35
    assert len(MODEL_CLASSES) == 35
    assert all(Base.metadata.tables[name] is table for name, table in TABLES.items())
    assert all(table.primary_key.columns for table in TABLES.values())
    assert sum(len(model.__mapper__.relationships) for model in MODEL_CLASSES.values()) == 54


@pytest.fixture(scope="module")
def postgres_engine() -> Engine:
    if os.getenv("SOLARVERSE_RUN_PG_INTEGRATION") != "1":
        pytest.skip("Set SOLARVERSE_RUN_PG_INTEGRATION=1 for isolated PostgreSQL integration tests")
    url = os.getenv("DATABASE_URL")
    if not url:
        pytest.fail("DATABASE_URL must point to the isolated migration test database")
    engine = create_database_engine(url)
    with engine.connect() as connection:
        name = connection.execute(text("SELECT current_database()")).scalar_one()
        if name != EXPECTED_DATABASE:
            engine.dispose()
            pytest.fail(f"Refusing PostgreSQL integration tests against unexpected database {name!r}")
        version = connection.execute(text("SHOW server_version_num")).scalar_one()
        if int(version) < 160000:
            engine.dispose()
            pytest.fail(f"PostgreSQL 16 or later is required, got server_version_num={version}")
    yield engine
    engine.dispose()


@pytest.fixture
def pg_transaction(postgres_engine: Engine):
    connection = postgres_engine.connect()
    transaction = connection.begin()
    try:
        yield connection
    finally:
        transaction.rollback()
        connection.close()


def test_postgres_migration_head_and_canonical_tables(postgres_engine: Engine) -> None:
    with postgres_engine.connect() as connection:
        migration_context = MigrationContext.configure(connection)
        assert migration_context.get_current_heads() == (EXPECTED_HEAD,)
        assert ScriptDirectory.from_config(Config("alembic.ini")).get_heads() == [EXPECTED_HEAD]
        revision_width = connection.execute(
            text(
                "SELECT character_maximum_length FROM information_schema.columns "
                "WHERE table_schema = 'public' AND table_name = 'alembic_version' "
                "AND column_name = 'version_num'"
            )
        ).scalar_one()
        assert revision_width == 128
        inspector = inspect(connection)
        canonical_tables = set(inspector.get_table_names(schema="public")) - {"alembic_version"}
        assert canonical_tables == set(TABLES)


def test_postgres_metadata_matches_columns_constraints_and_indexes(
    postgres_engine: Engine,
) -> None:
    inspector = inspect(postgres_engine)
    assert set(inspector.get_table_names(schema="public")) - {"alembic_version"} == set(TABLES)

    for name, table in TABLES.items():
        columns = inspector.get_columns(name, schema="public")
        assert {column["name"] for column in columns} == set(table.columns.keys()), name
        for column in columns:
            assert column["nullable"] == table.c[column["name"]].nullable, (name, column["name"])

        actual_fks = inspector.get_foreign_keys(name, schema="public")
        expected_fks = [constraint for constraint in table.foreign_key_constraints]
        assert len(actual_fks) == len(expected_fks), name
        assert {
            (tuple(fk["constrained_columns"]), fk["referred_table"], tuple(fk["referred_columns"]))
            for fk in actual_fks
        } == {
            (
                tuple(column.name for column in fk.columns),
                next(iter(fk.elements)).column.table.name,
                tuple(element.column.name for element in fk.elements),
            )
            for fk in expected_fks
        }, name

        actual_checks = {item["name"] for item in inspector.get_check_constraints(name, schema="public")}
        expected_checks = {
            constraint.name
            for constraint in table.constraints
            if isinstance(constraint, CheckConstraint)
        }
        assert actual_checks == expected_checks, name

        actual_uniques = inspector.get_unique_constraints(name, schema="public")
        expected_uniques = [
            constraint for constraint in table.constraints if isinstance(constraint, UniqueConstraint)
        ]
        assert {
            tuple(item["column_names"]) for item in actual_uniques
        } == {
            tuple(column.name for column in constraint.columns) for constraint in expected_uniques
        }, name

        unique_constraint_names = {item["name"] for item in actual_uniques}
        actual_indexes = {
            item["name"]
            for item in inspector.get_indexes(name, schema="public")
            if item["name"] not in unique_constraint_names
        }
        expected_indexes = {index.name for index in table.indexes if index.name}
        assert actual_indexes == expected_indexes, name


def _insert_customer_site_enquiry(connection: Connection):
    customer_id, site_id, enquiry_id = uuid4(), uuid4(), uuid4()
    connection.execute(
        text("INSERT INTO customer (id, name, phone_e164) VALUES (:id, 'Integration', '+919876543210')"),
        {"id": customer_id},
    )
    connection.execute(
        text("INSERT INTO site (id, customer_id, address_line) VALUES (:id, :customer, 'Test address')"),
        {"id": site_id, "customer": customer_id},
    )
    connection.execute(
        text("INSERT INTO enquiry (id, customer_id, site_id) VALUES (:id, :customer, :site)"),
        {"id": enquiry_id, "customer": customer_id, "site": site_id},
    )
    return customer_id, site_id, enquiry_id


def test_postgres_survey_requires_enquiry_and_matching_site(pg_transaction: Connection) -> None:
    _, site_a, enquiry_a = _insert_customer_site_enquiry(pg_transaction)
    _, site_b, _ = _insert_customer_site_enquiry(pg_transaction)

    pg_transaction.execute(
        text("INSERT INTO site_survey (id, enquiry_id, site_id) VALUES (:id, :enquiry, :site)"),
        {"id": uuid4(), "enquiry": enquiry_a, "site": site_a},
    )

    with pytest.raises(IntegrityError):
        with pg_transaction.begin_nested():
            pg_transaction.execute(
                text("INSERT INTO site_survey (id, enquiry_id, site_id) VALUES (:id, NULL, :site)"),
                {"id": uuid4(), "site": site_a},
            )

    with pytest.raises(IntegrityError):
        with pg_transaction.begin_nested():
            pg_transaction.execute(
                text("INSERT INTO site_survey (id, enquiry_id, site_id) VALUES (:id, :enquiry, :site)"),
                {"id": uuid4(), "enquiry": enquiry_a, "site": site_b},
            )


def test_postgres_user_normalized_email_unique_and_check(pg_transaction: Connection) -> None:
    identifier = uuid4()
    pg_transaction.execute(
        text(
            "INSERT INTO app_user (id, display_name, email_normalized, password_hash, role) "
            "VALUES (:id, 'Reviewer', 'reviewer@example.test', 'test-hash', 'surveyor')"
        ),
        {"id": identifier},
    )
    with pytest.raises(IntegrityError):
        with pg_transaction.begin_nested():
            pg_transaction.execute(
                text(
                    "INSERT INTO app_user (id, display_name, email_normalized, password_hash, role) "
                    "VALUES (:id, 'Duplicate', 'reviewer@example.test', 'test-hash', 'surveyor')"
                ),
                {"id": uuid4()},
            )
    with pytest.raises(IntegrityError):
        with pg_transaction.begin_nested():
            pg_transaction.execute(
                text(
                    "INSERT INTO app_user (id, display_name, email_normalized, password_hash, role) "
                    "VALUES (:id, 'Invalid', ' Reviewer@example.test ', 'test-hash', 'surveyor')"
                ),
                {"id": uuid4()},
            )
