import json

class TestDeleteAPI:
    """Test T030: Contract tests for DELETE /api/names/{id} - verify 200 response and item removal"""
    
    def test_delete_existing_name_returns_200(self, client):
        """DELETE /api/names/{id} should return 200 for existing items"""
        # First, add a name to delete
        post_resp = client.post(
            "/api/names",
            data=json.dumps({"name": "ToDelete"}),
            content_type="application/json",
        )
        assert post_resp.status_code == 201
        
        # Get the current list to find the ID
        get_resp = client.get("/api/names")
        assert get_resp.status_code == 200
        names_list = get_resp.get_json()
        
        # Find our test entry
        target_entry = None
        for entry in names_list:
            if entry["name"] == "ToDelete":
                target_entry = entry
                break
        
        assert target_entry is not None, "Test entry 'ToDelete' not found"
        target_id = target_entry["id"]
        
        # Now delete it
        delete_resp = client.delete(f"/api/names/{target_id}")
        assert delete_resp.status_code == 200
        
        data = delete_resp.get_json()
        assert "message" in data
        assert "deleted" in data["message"].lower()
    
    def test_delete_nonexistent_name_returns_200(self, client):
        """DELETE /api/names/{id} should return 200 even for non-existent IDs"""
        # Use a very high ID that likely doesn't exist
        nonexistent_id = 999999
        
        delete_resp = client.delete(f"/api/names/{nonexistent_id}")
        assert delete_resp.status_code == 200
        
        data = delete_resp.get_json()
        assert "message" in data
        # The message should indicate deletion (even if item didn't exist)
        assert "deleted" in data["message"].lower()
    
    def test_delete_removes_item_from_get_response(self, client):
        """After DELETE, the item should no longer appear in GET /api/names"""
        # Add a unique test name
        import time
        unique_name = f"DeleteTest_{int(time.time())}"
        
        post_resp = client.post(
            "/api/names",
            data=json.dumps({"name": unique_name}),
            content_type="application/json",
        )
        assert post_resp.status_code == 201
        
        # Verify it exists in GET response
        get_resp_before = client.get("/api/names")
        assert get_resp_before.status_code == 200
        names_before = get_resp_before.get_json()
        
        target_entry = None
        for entry in names_before:
            if entry["name"] == unique_name:
                target_entry = entry
                break
        
        assert target_entry is not None, f"Test entry '{unique_name}' not found before deletion"
        target_id = target_entry["id"]
        
        # Delete the item
        delete_resp = client.delete(f"/api/names/{target_id}")
        assert delete_resp.status_code == 200
        
        # Verify it's gone from GET response
        get_resp_after = client.get("/api/names")
        assert get_resp_after.status_code == 200
        names_after = get_resp_after.get_json()
        
        # Confirm the deleted item is no longer in the list
        deleted_entry = None
        for entry in names_after:
            if entry["name"] == unique_name:
                deleted_entry = entry
                break
        
        assert deleted_entry is None, f"Test entry '{unique_name}' still found after deletion"
        
        # Verify list count decreased (unless other tests added items simultaneously)
        # We can't guarantee exact count due to parallel tests, but verify entry is gone
        print(f"✓ Entry '{unique_name}' successfully removed from GET response")
    
    def test_delete_preserves_other_items(self, client):
        """DELETE should only remove the specified item, not affect others"""
        # Add two test items
        import time
        timestamp = str(int(time.time()))
        name1 = f"KeepThis_{timestamp}"
        name2 = f"DeleteThis_{timestamp}"
        
        # Add both names
        for name in [name1, name2]:
            resp = client.post(
                "/api/names",
                data=json.dumps({"name": name}),
                content_type="application/json",
            )
            assert resp.status_code == 201
        
        # Get current list and find both IDs
        get_resp = client.get("/api/names")
        assert get_resp.status_code == 200
        names_list = get_resp.get_json()
        
        keep_entry = None
        delete_entry = None
        for entry in names_list:
            if entry["name"] == name1:
                keep_entry = entry
            elif entry["name"] == name2:
                delete_entry = entry
        
        assert keep_entry is not None, f"'{name1}' not found"
        assert delete_entry is not None, f"'{name2}' not found"
        
        # Delete only the second item
        delete_resp = client.delete(f"/api/names/{delete_entry['id']}")
        assert delete_resp.status_code == 200
        
        # Verify the first item is still there
        get_resp_after = client.get("/api/names")
        assert get_resp_after.status_code == 200
        names_after = get_resp_after.get_json()
        
        kept_entry = None
        deleted_entry_check = None
        for entry in names_after:
            if entry["name"] == name1:
                kept_entry = entry
            elif entry["name"] == name2:
                deleted_entry_check = entry
        
        assert kept_entry is not None, f"'{name1}' was unexpectedly removed"
        assert deleted_entry_check is None, f"'{name2}' was not properly deleted"
        
        print(f"✓ DELETE preserved '{name1}' and removed '{name2}' correctly")