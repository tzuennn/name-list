CREATE TABLE IF NOT EXISTS names (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL CHECK (char_length(name) > 0 AND char_length(name) <= 50),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
