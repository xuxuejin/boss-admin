import pytest

from app.enums.response_codes import BizCode

pytestmark = pytest.mark.integration


def test_login_invalid_captcha(client, monkeypatch):
    from app.utils.captcha import Captcha

    monkeypatch.setattr(
        Captcha,
        "verify_captcha",
        lambda self, captcha_id, captcha_code: False,
    )

    response = client.post(
        "/api/auth/login",
        json={
            "username": "boss",
            "password": "boss123",
            "captcha_id": "cid",
            "captcha_code": "bad",
        },
    )

    data = response.get_json()
    assert response.status_code == 200
    assert data["code"] == BizCode.CAPTCHA_ERROR


def test_login_success_sets_cookie(client, test_user, login):
    response = login(username=test_user["username"], password=test_user["password"])
    data = response.get_json()

    assert response.status_code == 200
    assert data["code"] == BizCode.SUCCESS
    assert client.get_cookie("access_token_cookie") is not None
    assert client.get_cookie("csrf_access_token") is not None


def test_login_sql_injection_payload_does_not_bypass_auth(client, login):
    response = login(
        username="boss' OR 1=1 -- ",
        password="anything",
    )
    data = response.get_json()

    assert response.status_code == 403
    assert data["code"] == BizCode.USER_OR_PASSWORD_ERROR
    assert client.get_cookie("access_token_cookie") is None
    assert client.get_cookie("csrf_access_token") is None


def test_session_unauthorized_without_login(client):
    response = client.get("/api/auth/session")
    data = response.get_json()

    assert response.status_code == 401
    assert data["code"] in {BizCode.TOKEN_INVALID, BizCode.TOKEN_EXPIRED}


def test_session_success_after_login(client, test_user, login):
    login(username=test_user["username"], password=test_user["password"])

    response = client.get("/api/auth/session")
    data = response.get_json()

    assert response.status_code == 200
    assert data["code"] == BizCode.SUCCESS
    assert data["data"]["username"] == test_user["username"]
