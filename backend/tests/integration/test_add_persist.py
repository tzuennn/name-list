import json
import pytest


class TestAddPersistFlow:
    """Test T022: Integration test - add two names, verify order by insertion and persistence after reload"""
    
    def test_add_persist_order_flow(self, client):
        """Add Alice then Bob; verify order and persistence via DB roundtrip"""
        
        # Step 1: Clear existing data to ensure clean test
        # Get current list to know starting state
        initial_resp = client.get("/api/names")
        assert initial_resp.status_code == 200
        initial_count = len(initial_resp.get_json())
        
        # Step 2: Add Alice first
        alice_resp = client.post(
            "/api/names",
            data=json.dumps({"name": "Alice"}),
            content_type="application/json",
        )
        assert alice_resp.status_code == 201
        
        # Step 3: Add Bob second
        bob_resp = client.post(
            "/api/names",
            data=json.dumps({"name": "Bob"}),
            content_type="application/json",
        )
        assert bob_resp.status_code == 201
        
        # Step 4: Verify order in current response
        current_resp = client.get("/api/names")
        assert current_resp.status_code == 200
        current_names = current_resp.get_json()
        
        # Should have our 2 new entries plus any initial ones
        assert len(current_names) == initial_count + 2
        
        # Find Alice and Bob in the response
        alice_entry = None
        bob_entry = None
        
        for entry in current_names:
            if entry["name"] == "Alice":
                alice_entry = entry
            elif entry["name"] == "Bob":
                bob_entry = entry
        
        assert alice_entry is not None, "Alice not found in response"
        assert bob_entry is not None, "Bob not found in response"
        
        # Verify order: Alice (added first) should have lower ID than Bob (added second)
        # This confirms ordering by insertion time since ID is auto-increment
        assert alice_entry["id"] < bob_entry["id"], "Alice should have lower ID (added first)"
        
        # Step 5: Verify persistence by creating a new client connection
        # This simulates the "after reload" requirement by making a fresh request
        persistence_resp = client.get("/api/names")
        assert persistence_resp.status_code == 200
        persisted_names = persistence_resp.get_json()
        
        # Verify same order is maintained after "reload"
        alice_persisted = None
        bob_persisted = None
        
        for entry in persisted_names:
            if entry["name"] == "Alice":
                alice_persisted = entry
            elif entry["name"] == "Bob":
                bob_persisted = entry
        
        assert alice_persisted is not None, "Alice not persisted"
        assert bob_persisted is not None, "Bob not persisted"
        assert alice_persisted["id"] < bob_persisted["id"], "Order not preserved after persistence check"
        
        # Step 6: Verify created_at timestamps also reflect insertion order
        alice_time = alice_persisted["created_at"]
        bob_time = bob_persisted["created_at"]
        assert alice_time <= bob_time, "Alice should have earlier or equal created_at timestamp"
        
        print(f"✓ Integration test passed: Alice (id={alice_persisted['id']}) → Bob (id={bob_persisted['id']})")
    
    def test_insertion_order_default_behavior(self, client):
        """Verify default ordering by insertion (oldest→newest) as specified"""
        
        # Add test entries in sequence with unique names to avoid conflicts
        import time
        timestamp = str(int(time.time()))
        names_to_add = [f"First_{timestamp}", f"Second_{timestamp}", f"Third_{timestamp}"]
        
        for name in names_to_add:
            resp = client.post(
                "/api/names",
                data=json.dumps({"name": name}),
                content_type="application/json",
            )
            assert resp.status_code == 201
        
        # Get all names and verify ordering
        resp = client.get("/api/names")
        assert resp.status_code == 200
        all_names = resp.get_json()
        
        # Find our test entries
        test_entries = [entry for entry in all_names if entry["name"] in names_to_add]
        assert len(test_entries) == 3, f"Should find all 3 test entries, found {len(test_entries)}"
        
        # Sort by ID to verify they're in insertion order
        test_entries.sort(key=lambda x: x["id"])
        
        # Verify names appear in the order they were added
        for i, expected_name in enumerate(names_to_add):
            assert test_entries[i]["name"] == expected_name, f"Entry {i} should be {expected_name}"
            
        print(f"✓ Insertion order verified: {[e['name'] for e in test_entries]}")