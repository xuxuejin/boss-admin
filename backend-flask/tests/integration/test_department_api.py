import pytest

from app.enums.response_codes import BizCode

pytestmark = pytest.mark.integration


def test_get_departments_empty_list(client, test_user, login):
    login(username=test_user["username"], password=test_user["password"])

    response = client.get("/api/department")
    data = response.get_json()

    assert response.status_code == 200
    assert data["code"] == BizCode.SUCCESS
    assert data["data"] == []


def test_create_department_success(client, auth_headers, test_user, login):
    response = client.post(
        "/api/department",
        json={
            "name": "研发部",
            "order": 1,
            "leader": "Alice",
            "phone": "13800138000",
            "email": "rd@example.com",
            "status": 1,
            "parent_id": None,
        },
        headers=auth_headers,
    )
    data = response.get_json()

    assert response.status_code == 200
    assert data["code"] == BizCode.SUCCESS
    assert data["data"]["name"] == "研发部"
    assert isinstance(data["data"]["create_time"], int)
