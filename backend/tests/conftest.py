import os
import sys
import pytest

# Set up test environment variables before importing app
os.environ.setdefault('DB_HOST', 'localhost')
os.environ.setdefault('DB_PORT', '5433')
os.environ.setdefault('DB_NAME', 'appdb')
os.environ.setdefault('DB_USER', 'appuser')
os.environ.setdefault('DB_PASSWORD', 'apppass')

# Add backend directory to Python path for imports
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

from app import app

@pytest.fixture
def client():
    """Test client for Flask app - uses testing mode with real DB"""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client