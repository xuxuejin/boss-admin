import pytest

from app.utils.response import success, error
from app.enums.response_codes import BizCode, HttpStatus

pytestmark = pytest.mark.unit


def test_success_response_structure(app):
    with app.app_context():
        response = success(
            code=BizCode.SUCCESS,
            data={"ok": True},
            message="Success",
            status=HttpStatus.OK,
        )
        data = response.get_json()

        assert response.status_code == 200
        assert data["code"] == BizCode.SUCCESS
        assert data["data"] == {"ok": True}
        assert data["message"] == "Success"


def test_error_response_structure(app):
    with app.app_context():
        response = error(
            code=BizCode.INVALID_PARAMS,
            data=None,
            message="Invalid request parameters",
            status=HttpStatus.BAD_REQUEST,
        )
        data = response.get_json()

        assert response.status_code == 400
        assert data["code"] == BizCode.INVALID_PARAMS
        assert data["data"] is None
        assert data["message"] == "Invalid request parameters"
