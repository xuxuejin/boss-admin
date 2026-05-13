import redis
from flask import Blueprint
from flask_babel import gettext as _

from app.enums.response_codes import BizCode, HttpStatus
from app.extensions import limiter, redis_client
from app.security.auth import public_route
from app.utils.captcha import Captcha
from app.utils.response import error, success

captcha_bp = Blueprint('captcha', __name__)


@captcha_bp.route('/captcha', methods=['GET'])
@limiter.limit('5 per minute')  # 限制为每分钟 5 次
@public_route
def get_captcha():
    """
    生成并返回验证码图片
    """
    try:
        captcha_gen = Captcha(redis_client)
        captcha_id, base64_data = captcha_gen.generate_captcha_base64()
    except redis.exceptions.ConnectionError:
        return error(
            code=BizCode.INTERNAL_ERROR,
            message=_('Failed to generate captcha due to server error'),
            status=HttpStatus.SERVICE_UNAVAILABLE,
        )

    if not captcha_id:
        return error(
            code=BizCode.INTERNAL_ERROR,
            message=_('Failed to generate captcha'),
            status=HttpStatus.INTERNAL_SERVER_ERROR,
        )

    return success(
        code=BizCode.SUCCESS,
        data={'img': base64_data, 'uuid': captcha_id},
        message=_('Success'),
        status=HttpStatus.OK,
    )
