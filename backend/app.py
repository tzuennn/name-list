import os
from flask import Flask, request, jsonify
from psycopg2.pool import SimpleConnectionPool
from psycopg2.extras import RealDictCursor

DB_HOST = os.getenv("DB_HOST")
DB_PORT = int(os.getenv("DB_PORT", "5432"))
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")

if not all([DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD]):
    raise RuntimeError("One or more required environment variables are missing.")

app = Flask(__name__)

pool = SimpleConnectionPool(
    minconn=1,
    maxconn=10,
    host=DB_HOST,
    port=DB_PORT,
    dbname=DB_NAME,
    user=DB_USER,
    password=DB_PASSWORD,
)

def query(sql, params=None, fetch=False):
    conn = pool.getconn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(sql, params or ())
            if fetch:
                rows = cur.fetchall()
                conn.commit()
                return rows
            conn.commit()
    finally:
        pool.putconn(conn)

@app.get("/api/health")
def health():
    # Basic DB health check
    rows = query("SELECT 1 AS ok;", fetch=True)
    return {"status": "ok", "db": rows[0]["ok"] == 1}

@app.get("/api/names")
def list_names():
    rows = query("SELECT id, name, created_at FROM names ORDER BY id;", fetch=True)
    return jsonify(rows)

@app.post("/api/names")
def add_name():
    data = request.get_json(silent=True) or {}
    name = data.get("name", "").strip()

    # Validation
    if not name:
        return jsonify({"error": "Name cannot be empty."}), 400
    if len(name) > 50:
        return jsonify({"error": "Name too long (max 50)."}), 400

    query(
        "INSERT INTO names (name) VALUES (%s);",
        (name,),
        fetch=False
    )
    return jsonify({"message": "Created"}), 201

@app.delete("/api/names/<int:name_id>")
def delete_name(name_id: int):
    # Delete the name (idempotent - returns 200 even if ID doesn't exist)
    query("DELETE FROM names WHERE id = %s;", (name_id,), fetch=False)
    return jsonify({"message": "Deleted"}), 200

# root note (optional)
@app.get("/")
def root():
    return jsonify({"message": "Backend API. Use /api/names"}), 200
