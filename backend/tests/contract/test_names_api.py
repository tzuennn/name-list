import json
import pytest


class TestNamesAPI:
    """Test T021: Contract tests for POST /api/names (201, 400) and GET /api/names"""
    
    def test_post_names_success(self, client):
        """POST /api/names should return 201 for valid names"""
        resp = client.post(
            "/api/names",
            data=json.dumps({"name": "Alice"}),
            content_type="application/json",
        )
        assert resp.status_code == 201
        data = resp.get_json()
        assert data["message"] == "Created"
    
    def test_post_names_blank_error(self, client):
        """POST /api/names should return 400 for blank names"""
        resp = client.post(
            "/api/names",
            data=json.dumps({"name": ""}),
            content_type="application/json",
        )
        assert resp.status_code == 400
        data = resp.get_json()
        assert "error" in data
        assert "empty" in data["error"].lower()
    
    def test_post_names_too_long_error(self, client):
        """POST /api/names should return 400 for names >50 chars"""
        resp = client.post(
            "/api/names",
            data=json.dumps({"name": "a" * 51}),
            content_type="application/json",
        )
        assert resp.status_code == 400
        data = resp.get_json()
        assert "error" in data
        assert "too long" in data["error"].lower()
    
    def test_get_names_returns_created_entries(self, client):
        """GET /api/names should return entries that were created"""
        # Clear any existing names first by getting current list
        resp = client.get("/api/names")
        existing_names = resp.get_json()
        
        # Add a test name
        test_name = "TestUser123"
        post_resp = client.post(
            "/api/names",
            data=json.dumps({"name": test_name}),
            content_type="application/json",
        )
        assert post_resp.status_code == 201
        
        # Verify it appears in GET response
        get_resp = client.get("/api/names")
        assert get_resp.status_code == 200
        names_list = get_resp.get_json()
        
        # Should have at least our test name
        assert len(names_list) >= len(existing_names) + 1
        
        # Find our test name in the response
        test_entry = None
        for entry in names_list:
            if entry["name"] == test_name:
                test_entry = entry
                break
        
        assert test_entry is not None, f"Test name '{test_name}' not found in response"
        assert "id" in test_entry
        assert "created_at" in test_entry
        assert test_entry["name"] == test_name
    
    def test_get_names_structure(self, client):
        """GET /api/names should return proper JSON structure"""
        resp = client.get("/api/names")
        assert resp.status_code == 200
        
        data = resp.get_json()
        assert isinstance(data, list)
        
        # If there are entries, check structure
        if data:
            entry = data[0]
            assert "id" in entry
            assert "name" in entry  
            assert "created_at" in entry
            assert isinstance(entry["id"], int)
            assert isinstance(entry["name"], str)
            assert isinstance(entry["created_at"], str)