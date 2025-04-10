import pytest
from fastapi.testclient import TestClient
from server import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Hello World"}

# Since this is a frontend-heavy game with minimal backend,
# we only need to test the root endpoint for now.
# More tests can be added if backend features are implemented later.
