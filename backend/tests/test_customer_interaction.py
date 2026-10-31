"""Tests for the Customer Interaction model."""

from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy import CheckConstraint, ForeignKeyConstraint, Index, create_engine, event
from sqlalchemy.dialects.postgresql import UUID as PostgreSQLUUID
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, configure_mappers

from app.db.base import Base
from app.models import Customer, CustomerInteraction, Enquiry, Site


def test_customer_interaction_is_registered_in_metadata() -> None:
    assert CustomerInteraction in {
        mapper.class_ for mapper in Base.registry.mappers
    }
    assert Base.metadata.tables["customer_interaction"] is CustomerInteraction.__table__


def test_customer_interaction_uuid_primary_key_configuration() -> None:
    primary_key = CustomerInteraction.__table__.primary_key
    column = primary_key.columns[0]

    assert list(primary_key.columns.keys()) == ["id"]
    assert isinstance(column.type, PostgreSQLUUID)
    assert column.default is not None
    assert column.default.is_callable is True
    assert column.default.arg.__name__ == uuid4.__name__


def test_customer_interaction_columns_and_foreign_key() -> None:
    table = CustomerInteraction.__table__

    assert table.c.enquiry_id.nullable is False
    assert table.c.interaction_type.nullable is False
    assert table.c.notes.nullable is True
    assert table.c.occurred_at.nullable is False
    assert table.c.created_at.nullable is False

    foreign_key = next(iter(table.c.enquiry_id.foreign_keys))
    assert foreign_key.target_fullname == "enquiry.id"
    assert foreign_key.ondelete == "RESTRICT"
    assert any(
        isinstance(constraint, ForeignKeyConstraint)
        and constraint.column_keys == ["enquiry_id"]
        for constraint in table.constraints
    )


def test_customer_interaction_check_constraint_and_index() -> None:
    table = CustomerInteraction.__table__
    checks = {
        constraint.name: str(constraint.sqltext)
        for constraint in table.constraints
        if isinstance(constraint, CheckConstraint)
    }

    assert "ck_customer_interaction_type_allowed" in checks
    for interaction_type in ("call", "email", "visit", "note", "whatsapp", "sms"):
        assert interaction_type in checks["ck_customer_interaction_type_allowed"]

    index = next(
        index
        for index in table.indexes
        if index.name == "ix_customer_interaction_enquiry_occurred_at"
    )
    assert isinstance(index, Index)
    assert [column.name for column in index.columns] == [
        "enquiry_id",
        "occurred_at",
    ]


def test_customer_interaction_relationships_configure_without_warnings() -> None:
    configure_mappers()

    assert Enquiry.interactions.property.back_populates == "enquiry"
    assert CustomerInteraction.enquiry.property.back_populates == "interactions"
    assert Enquiry.interactions.property.viewonly is False
    assert CustomerInteraction.enquiry.property.viewonly is False


def test_customer_interaction_type_check_is_enforced() -> None:
    engine = create_engine("sqlite:///:memory:")

    @event.listens_for(engine, "connect")
    def enable_sqlite_foreign_keys(
        dbapi_connection: object,
        connection_record: object,
    ) -> None:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    Base.metadata.create_all(
        engine,
        tables=[
            Customer.__table__,
            Site.__table__,
            Enquiry.__table__,
            CustomerInteraction.__table__,
        ],
    )
    timestamp = datetime.now(timezone.utc)

    try:
        with Session(engine) as session:
            customer = Customer(
                name="Customer",
                phone_e164="+919876543210",
                created_at=timestamp,
            )
            session.add(customer)
            session.flush()
            site = Site(
                customer=customer,
                address_line="Address",
                created_at=timestamp,
            )
            session.add(site)
            session.flush()
            enquiry = Enquiry(
                customer_id=customer.id,
                site_id=site.id,
                created_at=timestamp,
            )
            session.add(enquiry)
            session.flush()
            enquiry_id = enquiry.id
            session.commit()

        for interaction_type in ("call", "email", "visit", "note", "whatsapp", "sms"):
            with Session(engine) as session:
                valid_interaction = CustomerInteraction(
                    enquiry_id=enquiry_id,
                    interaction_type=interaction_type,
                    notes=None,
                    occurred_at=timestamp,
                    created_at=timestamp,
                )
                session.add(valid_interaction)
                session.flush()
                session.rollback()

        with Session(engine) as session:
            invalid_interaction = CustomerInteraction(
                enquiry_id=enquiry_id,
                interaction_type="carrier-pigeon",
                occurred_at=timestamp,
                created_at=timestamp,
            )
            session.add(invalid_interaction)
            try:
                session.flush()
            except IntegrityError:
                session.rollback()
            else:
                raise AssertionError(
                    "The interaction_type CHECK constraint accepted an invalid value."
                )
    finally:
        engine.dispose()
