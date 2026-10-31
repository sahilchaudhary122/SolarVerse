"""Unit tests for the foundational SQLAlchemy models."""

from uuid import UUID, uuid4

from sqlalchemy import (
    CHAR,
    CheckConstraint,
    ForeignKeyConstraint,
    UniqueConstraint,
    create_engine,
    event,
)
from sqlalchemy.dialects.postgresql import UUID as PostgreSQLUUID
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.base import Base
from app.models import Customer, Enquiry, Site


def test_model_imports_and_metadata_registration() -> None:
    registered_models = {mapper.class_ for mapper in Base.registry.mappers}

    assert {Customer, Site, Enquiry}.issubset(registered_models)
    assert Base.metadata.tables.keys() >= {"customer", "site", "enquiry"}


def test_foundational_table_names_and_primary_keys() -> None:
    assert Customer.__tablename__ == "customer"
    assert Site.__tablename__ == "site"
    assert Enquiry.__tablename__ == "enquiry"

    for model in (Customer, Site, Enquiry):
        primary_key = model.__table__.primary_key
        assert len(primary_key.columns) == 1
        assert primary_key.columns[0].name == "id"
        assert isinstance(primary_key.columns[0].type, PostgreSQLUUID)


def test_uuid_generation_is_valid_and_unique() -> None:
    generated_ids = [uuid4() for _ in range(6)]

    assert all(isinstance(identifier, UUID) for identifier in generated_ids)
    assert all(UUID(str(identifier)) == identifier for identifier in generated_ids)
    assert len(set(generated_ids)) == len(generated_ids)


def test_model_uuid_defaults_use_uuid4_callable() -> None:
    for model in (Customer, Site, Enquiry):
        default = model.__table__.c.id.default

        assert default is not None
        assert default.is_callable is True
        assert default.arg.__name__ == uuid4.__name__


def test_customer_columns_allow_duplicate_phone_numbers() -> None:
    phone_column = Customer.__table__.c.phone_e164

    assert phone_column.nullable is False
    assert phone_column.unique is not True
    assert not any(
        isinstance(constraint, UniqueConstraint)
        and {column.name for column in constraint.columns} == {"phone_e164"}
        for constraint in Customer.__table__.constraints
    )


def test_site_columns_and_customer_foreign_key() -> None:
    site = Site.__table__

    assert site.c.customer_id.nullable is False
    assert site.c.address_line.nullable is False
    assert site.c.label.nullable is True
    assert isinstance(site.c.country_code.type, CHAR)
    assert site.c.country_code.type.length == 2
    assert site.c.country_code.server_default is not None
    customer_foreign_key = next(iter(site.c.customer_id.foreign_keys))
    assert customer_foreign_key.target_fullname == "customer.id"
    assert customer_foreign_key.ondelete == "RESTRICT"
    assert any(
        isinstance(constraint, ForeignKeyConstraint)
        and constraint.column_keys == ["customer_id"]
        for constraint in site.constraints
    )


def test_enquiry_fields_and_relationship_foreign_keys() -> None:
    enquiry = Enquiry.__table__

    assert enquiry.c.customer_id.nullable is False
    assert enquiry.c.site_id.nullable is False
    assert enquiry.c.monthly_bill.nullable is True
    assert enquiry.c.requested_capacity_kw.nullable is True
    assert enquiry.c.requested_system_type.nullable is True
    assert enquiry.c.status.nullable is False
    assert "updated_at" not in enquiry.c

    customer_foreign_key = next(
        foreign_key
        for foreign_key in enquiry.c.customer_id.foreign_keys
        if foreign_key.target_fullname == "customer.id"
    )
    assert customer_foreign_key.ondelete == "RESTRICT"

    composite_foreign_key = next(
        constraint
        for constraint in enquiry.constraints
        if isinstance(constraint, ForeignKeyConstraint)
        and constraint.name == "fk_enquiry_site_owned_by_customer"
    )
    assert composite_foreign_key.column_keys == ["customer_id", "site_id"]
    assert [
        element.target_fullname for element in composite_foreign_key.elements
    ] == ["site.customer_id", "site.id"]
    assert composite_foreign_key.ondelete == "RESTRICT"


def test_enquiry_constraints_cover_status_and_system_type() -> None:
    constraints = {
        constraint.name: str(constraint.sqltext)
        for constraint in Enquiry.__table__.constraints
        if isinstance(constraint, CheckConstraint)
    }

    assert "ck_enquiry_status_allowed" in constraints
    assert "ck_enquiry_requested_system_type_allowed" in constraints
    assert "'on-grid'" in constraints["ck_enquiry_requested_system_type_allowed"]
    assert "'off-grid'" in constraints["ck_enquiry_requested_system_type_allowed"]
    assert "ck_enquiry_monthly_bill_non_negative" in constraints
    assert "ck_enquiry_requested_capacity_positive" in constraints


def test_customer_site_enquiry_relationships_are_bidirectional() -> None:
    assert Customer.sites.property.back_populates == "customer"
    assert Customer.enquiries.property.back_populates == "customer"
    assert Site.customer.property.back_populates == "sites"
    assert Site.enquiries.property.back_populates == "site"
    assert Enquiry.customer.property.back_populates == "enquiries"
    assert Enquiry.site.property.back_populates == "enquiries"
