# Data Model: Refactor & Harden Name List App

Date: 2025-10-10  
Spec: ../spec.md

## Entities

### Name
- id: integer (PK)
- name: text (1..50 chars)
- created_at: timestamp (default now)

## API Contracts (Summary)

### GET /api/names
- Response: list of objects `{ id, name, created_at }`
- Ordering: current default by `id` (proxy for insertion time); future optional params `by=name|created_at`, `order=asc|desc`.

### POST /api/names
- Request: `{ name: string }` (trimmed, non-empty, ≤ 50 chars)
- Responses:
  - 201 `{ message: "Created" }`
  - 400 `{ error: "Name cannot be empty." }` or `{ error: "Name too long (max 50)." }`

### DELETE /api/names/{id}
- Response: 200 `{ message: "Deleted (if existed)" }`
