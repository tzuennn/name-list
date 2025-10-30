FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev curl && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code and tests
COPY app.py .
COPY tests/ tests/
COPY pytest.ini .

CMD ["gunicorn", "-w", "2", "-b", "0.0.0.0:8000", "app:app"]
