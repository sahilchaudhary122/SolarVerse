"""Tests for enquiries API endpoint."""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_create_enquiry_validation_error() -> None:
    response = client.post(
        "/api/v1/enquiries",
        json={
            "customer_name": "",  # invalid min length
            "phone": "12",       # invalid min length
            "address": "",       # invalid min length
        },
    )
    assert response.status_code == 422
