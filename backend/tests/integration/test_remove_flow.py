import json

class TestRemoveFlow:
    """Test T031: Integration test for add→delete flow leaving consistent state after reload"""
    
    def test_add_delete_flow_consistent_state(self, client):
        """Add items, delete one, verify state consistency after reload simulation"""
        
        # Step 1: Get initial state
        initial_resp = client.get("/api/names")
        assert initial_resp.status_code == 200
        initial_names = initial_resp.get_json()
        initial_count = len(initial_names)
        
        # Step 2: Add test items in sequence with unique names
        import time
        import uuid
        unique_id = str(uuid.uuid4())[:8]  # Short unique identifier
        timestamp = str(int(time.time()))
        test_names = [f"First_{unique_id}_{timestamp}", f"Second_{unique_id}_{timestamp}", f"Third_{unique_id}_{timestamp}"]
        
        for name in test_names:
            add_resp = client.post(
                "/api/names",
                data=json.dumps({"name": name}),
                content_type="application/json",
            )
            assert add_resp.status_code == 201
        
        # Step 3: Verify all items were added
        after_add_resp = client.get("/api/names")
        assert after_add_resp.status_code == 200
        after_add_names = after_add_resp.get_json()
        
        # Find our test entries and collect their IDs
        test_entries = []
        for entry in after_add_names:
            if entry["name"] in test_names:
                test_entries.append(entry)
        
        assert len(test_entries) == 3, f"Expected 3 test entries, found {len(test_entries)}"
        
        # Sort by ID to ensure consistent ordering
        test_entries.sort(key=lambda x: x["id"])
        
        # Step 4: Delete the middle item (Second_{unique_id}_{timestamp})
        middle_entry = None
        for entry in test_entries:
            if f"Second_{unique_id}_" in entry["name"]:
                middle_entry = entry
                break
        
        assert middle_entry is not None, "Middle test entry not found"
        
        delete_resp = client.delete(f"/api/names/{middle_entry['id']}")
        assert delete_resp.status_code == 200
        
        # Step 5: Verify immediate state after deletion
        after_delete_resp = client.get("/api/names")
        assert after_delete_resp.status_code == 200
        after_delete_names = after_delete_resp.get_json()
        
        # Should have 2 test entries remaining (First and Third)
        remaining_test_entries = []
        for entry in after_delete_names:
            if entry["name"] in test_names:
                remaining_test_entries.append(entry)
        
        assert len(remaining_test_entries) == 2, f"Expected 2 remaining entries, found {len(remaining_test_entries)}"
        
        # Verify the correct entries remain
        remaining_names = [entry["name"] for entry in remaining_test_entries]
        assert f"First_{unique_id}_{timestamp}" in remaining_names, "First entry should remain"
        assert f"Third_{unique_id}_{timestamp}" in remaining_names, "Third entry should remain"
        assert f"Second_{unique_id}_{timestamp}" not in remaining_names, "Second entry should be deleted"
        
        # Step 6: Simulate "after reload" by making fresh requests
        # This tests persistence through the database
        persistence_resp = client.get("/api/names")
        assert persistence_resp.status_code == 200
        persistent_names = persistence_resp.get_json()
        
        # Verify same state is maintained after "reload"
        persistent_test_entries = []
        for entry in persistent_names:
            if entry["name"] in test_names:
                persistent_test_entries.append(entry)
        
        assert len(persistent_test_entries) == 2, "Persistence check: should have 2 entries"
        
        persistent_names_list = [entry["name"] for entry in persistent_test_entries]
        assert f"First_{unique_id}_{timestamp}" in persistent_names_list, "Persistence: First entry missing"
        assert f"Third_{unique_id}_{timestamp}" in persistent_names_list, "Persistence: Third entry missing"
        assert f"Second_{unique_id}_{timestamp}" not in persistent_names_list, "Persistence: Deleted entry reappeared"
        
        # Step 7: Verify ordering is maintained (should still be by insertion time/ID)
        persistent_test_entries.sort(key=lambda x: x["id"])
        first_entry = persistent_test_entries[0]
        third_entry = persistent_test_entries[1]
        
        assert "First_" in first_entry["name"], "First entry should have lower ID"
        assert "Third_" in third_entry["name"], "Third entry should have higher ID"
        assert first_entry["id"] < third_entry["id"], "Ordering by insertion time should be preserved"
        
        print(f"✓ Add→Delete flow maintained consistent state: {[e['name'] for e in persistent_test_entries]}")
    
    def test_delete_to_empty_state(self, client):
        """Test deleting items until list is empty, verify empty state handling"""
        
        # Add a few test items with unique names
        import time
        import uuid
        unique_id = str(uuid.uuid4())[:8]
        timestamp = str(int(time.time()))
        test_names = [f"Empty1_{unique_id}_{timestamp}", f"Empty2_{unique_id}_{timestamp}"]
        
        for name in test_names:
            add_resp = client.post(
                "/api/names",
                data=json.dumps({"name": name}),
                content_type="application/json",
            )
            assert add_resp.status_code == 201
        
        # Get the list and find our test entries
        get_resp = client.get("/api/names")
        assert get_resp.status_code == 200
        all_names = get_resp.get_json()
        
        test_entries = [entry for entry in all_names if entry["name"] in test_names]
        assert len(test_entries) == 2, "Should have 2 test entries"
        
        # Delete both test entries
        for entry in test_entries:
            delete_resp = client.delete(f"/api/names/{entry['id']}")
            assert delete_resp.status_code == 200
        
        # Verify the specific test entries are gone
        final_resp = client.get("/api/names")
        assert final_resp.status_code == 200
        final_names = final_resp.get_json()
        
        remaining_test_entries = [entry for entry in final_names if entry["name"] in test_names]
        assert len(remaining_test_entries) == 0, "All test entries should be deleted"
        
        # Verify API still returns valid JSON (empty list or list with other entries)
        assert isinstance(final_names, list), "API should return a list"
        
        print(f"✓ Delete to empty state handled correctly - no test entries remain")
    
    def test_delete_nonexistent_maintains_consistency(self, client):
        """Test that deleting non-existent items doesn't affect existing data"""
        
        # Get current state
        before_resp = client.get("/api/names")
        assert before_resp.status_code == 200
        before_names = before_resp.get_json()
        before_count = len(before_names)
        
        # Try to delete a non-existent item (very high ID)
        nonexistent_id = 999999
        delete_resp = client.delete(f"/api/names/{nonexistent_id}")
        assert delete_resp.status_code == 200  # Should still return 200
        
        # Verify state is unchanged
        after_resp = client.get("/api/names")
        assert after_resp.status_code == 200
        after_names = after_resp.get_json()
        after_count = len(after_names)
        
        assert after_count == before_count, "List count should be unchanged"
        
        # Verify all entries are identical (order and content)
        assert len(before_names) == len(after_names), "Entry count mismatch"
        
        # Compare entries by ID (which should be stable)
        before_ids = sorted([entry["id"] for entry in before_names])
        after_ids = sorted([entry["id"] for entry in after_names])
        assert before_ids == after_ids, "Entry IDs should be identical"
        
        print(f"✓ Delete non-existent item maintained data consistency")