"""PostgreSQL-backed service-ticket authorization tests.

Run only against the explicitly isolated solarverse_workflow_test database.
Each test uses an outer transaction and rolls back all synthetic rows.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from datetime import date, datetime, timezone
from decimal import Decimal
from uuid import UUID, uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.engine import Connection
from sqlalchemy.orm import Session

from app.api.v1.auth import get_password_hash
from app.db.session import create_database_engine, get_db_session
from app.main import app
from app.models.canonical import MODEL_CLASSES

EXPECTED_DATABASE = "solarverse_workflow_test"
Customer = MODEL_CLASSES["customer"]
Site = MODEL_CLASSES["site"]
AppUser = MODEL_CLASSES["app_user"]
Technician = MODEL_CLASSES["technician"]


@dataclass
class RuntimeContext:
    client: TestClient
    connection: Connection


@pytest.fixture
def runtime_client():
    if os.getenv("SOLARVERSE_RUN_WORKFLOW_PG") != "1":
        pytest.skip("Set SOLARVERSE_RUN_WORKFLOW_PG=1 to use solarverse_workflow_test")
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        pytest.fail("DATABASE_URL must explicitly target solarverse_workflow_test")

    engine = create_database_engine(database_url)
    connection = engine.connect()
    database = connection.execute(text("SELECT current_database()")).scalar_one()
    if database != EXPECTED_DATABASE:
        connection.close()
        engine.dispose()
        pytest.fail(f"Refusing PostgreSQL workflow tests against {database!r}")
    connection.commit()
    transaction = connection.begin()

    def override_session():
        with Session(bind=connection, join_transaction_mode="create_savepoint") as session:
            yield session

    app.dependency_overrides[get_db_session] = override_session
    try:
        with TestClient(app) as client:
            yield RuntimeContext(client, connection)
    finally:
        app.dependency_overrides.pop(get_db_session, None)
        if transaction.is_active:
            transaction.rollback()
        connection.close()
        engine.dispose()


def _register_customer(client: TestClient) -> tuple[str, str, str]:
    suffix = uuid4().hex
    email = f"sv6-{suffix}@example.com"
    password = "SolarVerseStage6Customer923"
    response = client.post("/api/v1/auth/register", json={
        "full_name": "Stage 6 Synthetic Customer",
        "email": email,
        "mobile": f"+1555{int(suffix[:7], 16) % 10_000_000:07d}",
        "password": password,
    })
    assert response.status_code == 201, response.text
    token = response.json()["access_token"]
    me = client.get("/api/v1/customers/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200, me.text
    return token, me.json()["id"], email


def _create_staff(session: Session, role: str, email: str) -> None:
    session.add(AppUser(
        display_name=f"Stage 6 {role} account",
        email_normalized=email,
        password_hash=get_password_hash("SolarVerseStage6Staff923"),
        role=role,
        is_active=True,
    ))
    session.flush()


def _login(client: TestClient, email: str, password: str = "SolarVerseStage6Staff923") -> str:
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


def test_customer_can_create_retrieve_and_update_own_ticket(runtime_client: RuntimeContext) -> None:
    client = runtime_client.client
    token, _, _ = _register_customer(client)
    headers = {"Authorization": f"Bearer {token}"}

    created = client.post("/api/v1/support/tickets", headers=headers, json={"notes": "Synthetic opening request"})
    assert created.status_code == 201, created.text
    ticket = created.json()
    assert ticket["status"] == "open"
    assert [item["activity_type"] for item in ticket["activities"]] == ["customer_opening"]

    retrieved = client.get(f"/api/v1/support/tickets/{ticket['id']}", headers=headers)
    assert retrieved.status_code == 200, retrieved.text
    assert retrieved.json()["id"] == ticket["id"]

    update = client.post(
        f"/api/v1/support/tickets/{ticket['id']}/activities",
        headers=headers,
        json={"activity_type": "customer_update", "notes": "Synthetic customer follow-up"},
    )
    assert update.status_code == 201, update.text
    updated = client.get(f"/api/v1/support/tickets/{ticket['id']}", headers=headers)
    assert updated.status_code == 200, updated.text
    assert {item["activity_type"] for item in updated.json()["activities"]} == {"customer_opening", "customer_update"}

    forbidden_status = client.patch(
        f"/api/v1/support/tickets/{ticket['id']}/status",
        headers=headers,
        json={"status": "closed"},
    )
    assert forbidden_status.status_code == 403
    forbidden_assignment = client.post(
        f"/api/v1/support/tickets/{ticket['id']}/technicians",
        headers=headers,
        json={"technician_id": str(uuid4())},
    )
    assert forbidden_assignment.status_code == 403


def test_customer_cannot_read_or_update_another_customers_ticket(runtime_client: RuntimeContext) -> None:
    client = runtime_client.client
    owner_token, owner_id, _ = _register_customer(client)
    other_token, other_id, _ = _register_customer(client)
    owner_headers = {"Authorization": f"Bearer {owner_token}"}
    other_headers = {"Authorization": f"Bearer {other_token}"}

    ticket_response = client.post(
        "/api/v1/support/tickets",
        headers=other_headers,
        json={"notes": "Owned by the second synthetic customer"},
    )
    assert ticket_response.status_code == 201, ticket_response.text
    ticket_id = ticket_response.json()["id"]

    assert client.get(f"/api/v1/support/tickets/{ticket_id}", headers=owner_headers).status_code == 403
    assert client.post(
        f"/api/v1/support/tickets/{ticket_id}/activities",
        headers=owner_headers,
        json={"activity_type": "customer_update", "notes": "Must not be added"},
    ).status_code == 403
    assert client.get(f"/api/v1/customers/{other_id}", headers=owner_headers).status_code == 403
    assert owner_id != other_id

    wrong_customer = client.post(
        "/api/v1/support/tickets",
        headers=owner_headers,
        json={"customer_id": other_id, "notes": "Must be rejected"},
    )
    assert wrong_customer.status_code == 403


def test_staff_can_manage_ticket_and_technician_permissions_are_enforced(runtime_client: RuntimeContext) -> None:
    client = runtime_client.client
    customer_token, customer_id, _ = _register_customer(client)
    admin_email = f"sv6-admin-{uuid4().hex}@example.com"
    with Session(bind=runtime_client.connection, join_transaction_mode="create_savepoint") as session:
        _create_staff(session, "system_admin", admin_email)
        session.commit()
    admin_token = _login(client, admin_email)
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    customer_headers = {"Authorization": f"Bearer {customer_token}"}
    directory = client.get("/api/v1/auth/users", headers=admin_headers, params={"search": "Stage 6", "limit": 100})
    assert directory.status_code == 200, directory.text
    assert all("password_hash" not in item for item in directory.json())
    assert client.get("/api/v1/auth/users", headers=customer_headers).status_code == 403
    administrator = next(item for item in directory.json() if item["email"] == admin_email)
    detail = client.get(f"/api/v1/auth/users/{administrator['id']}", headers=admin_headers)
    assert detail.status_code == 200 and "password_hash" not in detail.json()
    assert client.patch(f"/api/v1/auth/users/{administrator['id']}/role", headers=admin_headers,
                        json={"role": "sales"}).status_code == 409
    assert client.patch(f"/api/v1/auth/users/{administrator['id']}/role", headers=customer_headers,
                        json={"role": "sales"}).status_code == 403
    report = client.get("/api/v1/reports/summary", headers=admin_headers)
    assert report.status_code == 200 and {"customers", "enquiries", "inventory", "payments"}.issubset(report.json()["reports"])
    assert client.get("/api/v1/reports/summary", headers=customer_headers).status_code == 403
    role_email = f"sv7-role-{uuid4().hex}@example.com"
    new_staff = client.post("/api/v1/auth/users", headers=admin_headers, json={
        "display_name": "Stage 7 role assignment test", "email": role_email,
        "password": "SolarVerseStage7StrongPassword39", "role": "sales",
    })
    assert new_staff.status_code == 201, new_staff.text
    reassigned = client.patch(f"/api/v1/auth/users/{new_staff.json()['id']}/role", headers=admin_headers,
                              json={"role": "management"})
    assert reassigned.status_code == 200 and reassigned.json()["role"] == "management"
    invalid_role = client.patch(f"/api/v1/auth/users/{new_staff.json()['id']}/role", headers=admin_headers,
                                json={"role": "system_owner"})
    assert invalid_role.status_code == 422

    created = client.post("/api/v1/support/tickets", headers=admin_headers, json={
        "customer_id": customer_id,
        "notes": "Staff-only internal opening note",
    })
    assert created.status_code == 201, created.text
    ticket_id = created.json()["id"]

    staff_activity = client.post(
        f"/api/v1/support/tickets/{ticket_id}/activities",
        headers=admin_headers,
        json={"activity_type": "diagnostic", "notes": "Staff-only diagnostic note"},
    )
    assert staff_activity.status_code == 201, staff_activity.text
    status_update = client.patch(
        f"/api/v1/support/tickets/{ticket_id}/status",
        headers=admin_headers,
        json={"status": "in_progress", "notes": "Technician started work"},
    )
    assert status_update.status_code == 200, status_update.text
    assert {row["activity_type"] for row in status_update.json()["activities"]} == {"created", "diagnostic", "status_change"}

    customer_view = client.get(f"/api/v1/support/tickets/{ticket_id}", headers=customer_headers)
    assert customer_view.status_code == 200, customer_view.text
    assert customer_view.json()["activities"] == []

    technician_email = f"sv6-tech-{uuid4().hex}@example.com"
    provisioned = client.post("/api/v1/auth/users", headers=admin_headers, json={
        "display_name": "Stage 6 Synthetic Technician",
        "email": technician_email,
        "password": "SolarVerseStage6Staff923",
        "role": "technician",
    })
    assert provisioned.status_code == 201, provisioned.text
    technician_token = _login(client, technician_email)
    assert client.get("/api/v1/auth/users", headers={"Authorization": f"Bearer {technician_token}"}).status_code == 403
    technician = client.post("/api/v1/installations/technicians", headers=admin_headers, json={
        "name": "Stage 6 Synthetic Technician",
    })
    assert technician.status_code == 201, technician.text

    assigned = client.post(
        f"/api/v1/support/tickets/{ticket_id}/technicians",
        headers=admin_headers,
        json={"technician_id": technician.json()["id"]},
    )
    assert assigned.status_code == 201, assigned.text
    denied_assignment = client.post(
        f"/api/v1/support/tickets/{ticket_id}/technicians",
        headers={"Authorization": f"Bearer {technician_token}"},
        json={"technician_id": technician.json()["id"]},
    )
    assert denied_assignment.status_code == 403

    staff_view = client.get(f"/api/v1/support/tickets/{ticket_id}", headers=admin_headers)
    assert staff_view.status_code == 200, staff_view.text
    assert len(staff_view.json()["technician_ids"]) == 1
    assert len(staff_view.json()["activities"]) == 3


def test_invalid_ticket_customer_and_site_references_are_rejected(runtime_client: RuntimeContext) -> None:
    client = runtime_client.client
    customer_a_token, customer_a_id, _ = _register_customer(client)
    customer_b_token, customer_b_id, _ = _register_customer(client)
    headers_a = {"Authorization": f"Bearer {customer_a_token}"}
    headers_b = {"Authorization": f"Bearer {customer_b_token}"}
    site_b_response = client.post("/api/v1/sites", headers=headers_b, json={
        "address_line": "Stage 6 synthetic site B",
        "city": "Example City",
    })
    assert site_b_response.status_code == 201, site_b_response.text
    site_b_id = site_b_response.json()["id"]

    admin_email = f"sv6-admin-{uuid4().hex}@example.com"
    with Session(bind=runtime_client.connection, join_transaction_mode="create_savepoint") as session:
        _create_staff(session, "system_admin", admin_email)
        session.commit()
    admin_headers = {"Authorization": f"Bearer {_login(client, admin_email)}"}

    missing_customer = client.post("/api/v1/support/tickets", headers=admin_headers, json={
        "customer_id": str(uuid4()),
        "notes": "Invalid customer reference test",
    })
    assert missing_customer.status_code == 404

    wrong_site = client.post("/api/v1/support/tickets", headers=admin_headers, json={
        "customer_id": customer_a_id,
        "site_id": site_b_id,
        "notes": "Invalid customer/site pair test",
    })
    assert wrong_site.status_code == 409

    customer_wrong_id = client.post("/api/v1/support/tickets", headers=headers_a, json={
        "customer_id": customer_b_id,
        "notes": "Customer cannot select another customer id",
    })
    assert customer_wrong_id.status_code == 403
    customer_wrong_site = client.post("/api/v1/support/tickets", headers=headers_a, json={
        "site_id": site_b_id,
        "notes": "Customer cannot select another customer site",
    })
    assert customer_wrong_site.status_code == 403


def test_ambiguous_customer_mapping_and_email_change_are_denied(runtime_client: RuntimeContext) -> None:
    client = runtime_client.client
    token, customer_id, email = _register_customer(client)
    headers = {"Authorization": f"Bearer {token}"}
    assert client.patch(f"/api/v1/customers/{customer_id}", headers=headers, json={
        "email": "changed-stage6@example.com",
    }).status_code == 403
    with Session(bind=runtime_client.connection, join_transaction_mode="create_savepoint") as session:
        session.add(Customer(name="Duplicate synthetic match", phone_e164="+15555550199", email=email))
        session.commit()

    assert client.get("/api/v1/customers/me", headers=headers).status_code == 409
    assert client.post("/api/v1/support/tickets", headers=headers, json={
        "notes": "Ambiguous ownership must fail closed",
    }).status_code == 403


def test_customer_portal_records_are_owner_scoped(runtime_client: RuntimeContext) -> None:
    client = runtime_client.client
    owner_token, _, _ = _register_customer(client)
    target_token, target_customer_id, _ = _register_customer(client)
    owner_headers = {"Authorization": f"Bearer {owner_token}"}
    target_headers = {"Authorization": f"Bearer {target_token}"}
    models = MODEL_CLASSES

    with Session(bind=runtime_client.connection, join_transaction_mode="create_savepoint") as session:
        site = models["site"](customer_id=UUID(target_customer_id), address_line="Stage 7 private site", country_code="IN")
        session.add(site)
        session.flush()
        enquiry = models["enquiry"](customer_id=UUID(target_customer_id), site_id=site.id, status="new")
        session.add(enquiry)
        session.flush()
        survey = models["site_survey"](enquiry_id=enquiry.id, site_id=site.id, status="approved", is_current=True,
                                        approved_at=datetime.now(timezone.utc))
        product = models["product"](name="Stage 7 portal module", category="module", tracks_serial_number=True, active=True)
        session.add_all([survey, product])
        session.flush()
        quote = models["quotation"](enquiry_id=enquiry.id, survey_id=survey.id, version=1, status="approved",
                                     currency_code="INR", subtotal_amount=Decimal("100.00"),
                                     discount_amount=Decimal("0.00"), tax_amount=Decimal("0.00"), total_amount=Decimal("100.00"))
        session.add(quote)
        session.flush()
        quote_line = models["quotation_line"](quotation_id=quote.id, product_id=product.id,
                                               description_snapshot="Stage 7 synthetic module", quantity=Decimal("1.000"),
                                               unit_price=Decimal("100.00"), discount_amount=Decimal("0.00"),
                                               tax_amount=Decimal("0.00"), line_total=Decimal("100.00"))
        order = models["sales_order"](quotation_id=quote.id, status="confirmed", currency_code="INR",
                                      subtotal_amount=Decimal("100.00"), discount_amount=Decimal("0.00"),
                                      tax_amount=Decimal("0.00"), total_amount=Decimal("100.00"))
        session.add_all([quote_line, order])
        session.flush()
        order_line = models["order_line"](order_id=order.id, source_quotation_line_id=quote_line.id,
                                          product_id=product.id, description_snapshot="Stage 7 synthetic module",
                                          quantity=Decimal("1.000"), unit_price=Decimal("100.00"),
                                          discount_amount=Decimal("0.00"), tax_amount=Decimal("0.00"),
                                          line_total=Decimal("100.00"))
        dispatch = models["dispatch"](order_id=order.id, status="dispatched", dispatched_at=datetime.now(timezone.utc))
        installation = models["installation"](order_id=order.id, site_id=site.id, status="scheduled")
        session.add_all([order_line, dispatch, installation])
        session.flush()
        dispatch_item = models["dispatch_item"](dispatch_id=dispatch.id, order_id=order.id, order_line_id=order_line.id,
                                                product_id=product.id, quantity=Decimal("1.000"))
        checklist = models["installation_checklist_item"](installation_id=installation.id, item_key="stage7-check",
                                                           description_snapshot="Synthetic completion check", is_completed=True,
                                                           completed_at=datetime.now(timezone.utc))
        session.add_all([dispatch_item, checklist])
        session.flush()
        unit = models["equipment_unit"](product_id=product.id, dispatch_item_id=dispatch_item.id,
                                         serial_number=f"SV7-{uuid4().hex}")
        session.add(unit)
        session.flush()
        warranty = models["warranty"](equipment_unit_id=unit.id, starts_on=date.today(),
                                      ends_on=date(date.today().year + 1, date.today().month, date.today().day),
                                      terms="Synthetic coverage")
        session.add(warranty)
        session.flush()
        ids = {"quotation": str(quote.id), "order": str(order.id), "installation": str(installation.id),
               "equipment": str(unit.id), "warranty": str(warranty.id)}
        session.commit()

    for resource in ("quotations", "orders", "installations", "equipment", "warranties"):
        assert client.get(f"/api/v1/customer-portal/{resource}", headers=owner_headers).json() == []
        assert len(client.get(f"/api/v1/customer-portal/{resource}", headers=target_headers).json()) == 1
    for resource, record_id in ids.items():
        response = client.get(f"/api/v1/customer-portal/{resource}/{record_id}", headers=owner_headers)
        assert response.status_code == 404, (resource, response.text)

    quotation = client.get(f"/api/v1/customer-portal/quotations/{ids['quotation']}", headers=target_headers)
    assert quotation.status_code == 200 and len(quotation.json()["lines"]) == 1
    order = client.get(f"/api/v1/customer-portal/orders/{ids['order']}", headers=target_headers)
    assert order.status_code == 200 and len(order.json()["lines"]) == 1
    assert order.json()["site"]["address_line"] == "Stage 7 private site"
    installation = client.get(f"/api/v1/customer-portal/installations/{ids['installation']}", headers=target_headers)
    assert installation.status_code == 200
    assert installation.json()["checklist_summary"] == {"total": 1, "completed": 1}
    equipment = client.get(f"/api/v1/customer-portal/equipment/{ids['equipment']}", headers=target_headers)
    assert equipment.status_code == 200 and equipment.json()["dispatch_status"] == "dispatched"
    warranty = client.get(f"/api/v1/customer-portal/warranties/{ids['warranty']}", headers=target_headers)
    assert warranty.status_code == 200 and warranty.json()["valid_now"] is True
    dashboard = client.get("/api/v1/customer-portal/dashboard", headers=target_headers)
    assert dashboard.status_code == 200 and dashboard.json()["quotations"] == 1 and dashboard.json()["orders"] == 1
    assert client.get("/api/v1/customer-portal/documents", headers=target_headers).status_code == 409
