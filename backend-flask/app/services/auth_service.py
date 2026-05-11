from flask_babel import gettext as _
from flask_jwt_extended import create_access_token

from app.exceptions import BizError
from app.enums.response_codes import BizCode, HttpStatus
from app.repositories import user as user_repo
from app.utils.captcha import Captcha


def login(payload, redis_client):
    captcha_gen = Captcha(redis_client)
    if not captcha_gen.verify_captcha(payload.captcha_id, payload.captcha_code):
        raise BizError(
            code=BizCode.CAPTCHA_ERROR,
            message=_("Invalid captcha"),
            status=HttpStatus.OK,
        )

    user = user_repo.get_by_username(payload.username)
    if not user or not user.check_password(payload.password):
        raise BizError(
            code=BizCode.USER_OR_PASSWORD_ERROR,
            message=_("Invalid username or password"),
            status=HttpStatus.FORBIDDEN,
        )

    return create_access_token(identity=str(user.id))


def get_session_user(user_id: int):
    user = user_repo.get_by_id(user_id)
    if not user:
        raise BizError(
            code=BizCode.USER_NOT_FOUND,
            message=_("Login has expired, please log in again"),
            status=HttpStatus.UNAUTHORIZED,
        )

    return user.to_dict()
