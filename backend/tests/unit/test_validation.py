import json
import pytest


def test_blank_name_rejected(client):
    """Test T020: Backend validation rejects blank names"""
    resp = client.post(
        "/api/names",
        data=json.dumps({"name": "   "}),
        content_type="application/json",
    )
    assert resp.status_code == 400
    data = resp.get_json()
    assert data["error"] == "Name cannot be empty."


def test_empty_name_rejected(client):
    """Test T020: Backend validation rejects empty names"""
    resp = client.post(
        "/api/names",
        data=json.dumps({"name": ""}),
        content_type="application/json",
    )
    assert resp.status_code == 400
    data = resp.get_json()
    assert data["error"] == "Name cannot be empty."


def test_too_long_name_rejected(client):
    """Test T020: Backend validation rejects names >50 chars"""
    long_name = "a" * 51
    resp = client.post(
        "/api/names",
        data=json.dumps({"name": long_name}),
        content_type="application/json",
    )
    assert resp.status_code == 400
    data = resp.get_json()
    assert "too long" in data["error"].lower()


def test_valid_name_accepted(client):
    """Test T020: Backend validation accepts valid names"""
    resp = client.post(
        "/api/names",
        data=json.dumps({"name": "Alice"}),
        content_type="application/json",
    )
    assert resp.status_code == 201
    data = resp.get_json()
    assert data["message"] == "Created"