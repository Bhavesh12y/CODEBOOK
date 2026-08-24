from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app


def test_health():
    client = TestClient(app)
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_execute_validation_rejects_missing_fields():
    client = TestClient(app)
    response = client.post("/api/execute", json={})
    assert response.status_code == 422

