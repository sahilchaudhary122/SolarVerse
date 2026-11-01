"""API contract tests that do not require database access."""

import pytest
from pydantic import ValidationError
from fastapi.testclient import TestClient

from app.main import app
from app.api.v1.files import FileAssetCreate
from app.api.v1.warranties import WarrantyCreate

client = TestClient(app)


def test_canonical_workflow_routes_are_registered() -> None:
    paths = set(client.get("/openapi.json").json()["paths"])
    expected = {
        "/api/v1/auth/register", "/api/v1/auth/login", "/api/v1/customers", "/api/v1/sites",
        "/api/v1/enquiries", "/api/v1/surveys", "/api/v1/products", "/api/v1/products/packages",
        "/api/v1/quotations", "/api/v1/orders", "/api/v1/inventory/movements",
        "/api/v1/dispatches", "/api/v1/installations", "/api/v1/warranties",
        "/api/v1/support/tickets", "/api/v1/payments", "/api/v1/files", "/api/v1/dashboard",
    }
    assert expected <= paths


def test_warranty_rejects_end_date_before_start_without_database_access() -> None:
    with pytest.raises(ValidationError):
        WarrantyCreate.model_validate({"equipment_unit_id": "00000000-0000-0000-0000-000000000001", "starts_on": "2026-02-01", "ends_on": "2026-01-31"})


def test_file_metadata_requires_exactly_one_parent_without_database_access() -> None:
    with pytest.raises(ValidationError):
        FileAssetCreate.model_validate({"bucket_name": "private", "storage_key": "asset/key", "original_name": "photo.jpg"})
