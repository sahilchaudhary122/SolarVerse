"""Database-level tests for foundational model constraints."""

from datetime import datetime, timezone

from sqlalchemy import create_engine, event
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.base import Base
from app.models import Customer, Enquiry, Site


def test_enquiry_site_must_be_owned_by_enquiry_customer() -> None:
    engine = create_engine(
        "sqlite:///:memory:",
        execution_options={"schema_translate_map": {"solarverse_legacy": None}},
    )

    @event.listens_for(engine, "connect")
    def enable_sqlite_foreign_keys(dbapi_connection: object, connection_record: object) -> None:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    Base.metadata.create_all(
        engine,
        tables=[Customer.__table__, Site.__table__, Enquiry.__table__],
    )
    timestamp = datetime.now(timezone.utc)

    try:
        with Session(engine) as session:
            customer_a = Customer(
                name="Customer A",
                phone_e164="+919876543210",
                created_at=timestamp,
            )
            customer_b = Customer(
                name="Customer B",
                phone_e164="+919876543211",
                created_at=timestamp,
            )
            session.add_all([customer_a, customer_b])
            session.flush()

            site_a = Site(
                customer=customer_a,
                address_line="Address A",
                created_at=timestamp,
            )
            site_b = Site(
                customer=customer_b,
                address_line="Address B",
                created_at=timestamp,
            )
            session.add_all([site_a, site_b])
            session.flush()

            enquiry_a_site_a = Enquiry(
                customer_id=customer_a.id,
                site_id=site_a.id,
                created_at=timestamp,
            )
            session.add(enquiry_a_site_a)
            session.flush()
            assert enquiry_a_site_a.site is site_a
            session.rollback()

        with Session(engine) as session:
            customer_a = Customer(
                name="Customer A",
                phone_e164="+919876543210",
                created_at=timestamp,
            )
            customer_b = Customer(
                name="Customer B",
                phone_e164="+919876543211",
                created_at=timestamp,
            )
            session.add_all([customer_a, customer_b])
            session.flush()
            site_a = Site(
                customer=customer_a,
                address_line="Address A",
                created_at=timestamp,
            )
            site_b = Site(
                customer=customer_b,
                address_line="Address B",
                created_at=timestamp,
            )
            session.add_all([site_a, site_b])
            session.flush()

            invalid_enquiry = Enquiry(
                customer_id=customer_a.id,
                site_id=site_b.id,
                created_at=timestamp,
            )
            session.add(invalid_enquiry)
            try:
                session.flush()
            except IntegrityError:
                session.rollback()
            else:
                raise AssertionError(
                    "The composite foreign key allowed Customer A to reference "
                    "Customer B's site."
                )

        with Session(engine) as session:
            customer_b = Customer(
                name="Customer B",
                phone_e164="+919876543211",
                created_at=timestamp,
            )
            session.add(customer_b)
            session.flush()
            site_b = Site(
                customer=customer_b,
                address_line="Address B",
                created_at=timestamp,
            )
            session.add(site_b)
            session.flush()

            enquiry_b_site_b = Enquiry(
                customer_id=customer_b.id,
                site_id=site_b.id,
                created_at=timestamp,
            )
            session.add(enquiry_b_site_b)
            session.flush()
            assert enquiry_b_site_b.site is site_b
            session.rollback()
    finally:
        engine.dispose()
