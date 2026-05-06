import pytest

from app.enums.response_codes import BizCode

pytestmark = pytest.mark.integration


def test_get_captcha_success(client):
    response = client.get("/api/captcha")
    data = response.get_json()

    assert response.status_code == 200
    assert data["code"] == BizCode.SUCCESS
    assert "img" in data["data"]
    assert "uuid" in data["data"]
