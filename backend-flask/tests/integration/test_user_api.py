import pytest

from app.enums.response_codes import BizCode

pytestmark = pytest.mark.integration


def test_get_current_user_success(client, test_user, login):
    login(username=test_user["username"], password=test_user["password"])

    response = client.get("/api/users/me")
    data = response.get_json()

    assert response.status_code == 200
    assert data["code"] == BizCode.SUCCESS
    assert data["data"]["username"] == test_user["username"]
