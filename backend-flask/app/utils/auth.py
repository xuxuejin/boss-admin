from flask import current_app, request
from flask_babel import gettext as _
from flask_jwt_extended import verify_jwt_in_request, unset_jwt_cookies
from jwt import ExpiredSignatureError
from flask_jwt_extended.exceptions import JWTExtendedException
from app.enums.response_codes import HttpStatus, BizCode
from app.utils.response import error as error_response


def public_route(view):
    view.__is_public__ = True
    return view


def jwt_required_if_not_public():
    """
    全局 before_request JWT 校验
    - public_route 标记的路由不会校验
    - 忽略静态资源和 OPTIONS 请求
    """
    if request.method == "OPTIONS" or request.endpoint == "static":
        return None

    if request.endpoint is None:
        return None

    view = current_app.view_functions.get(request.endpoint)
    if view and getattr(view, "__is_public__", False):
        return None

    try:
        verify_jwt_in_request()
    except (ExpiredSignatureError, JWTExtendedException) as e:
        # 统一处理过期和无效
        message = _("Login has expired, please log in again") if isinstance(e, ExpiredSignatureError) else _(
            "Invalid login token")
        biz_code = BizCode.TOKEN_EXPIRED if isinstance(e, ExpiredSignatureError) else BizCode.TOKEN_INVALID

        response = error_response(
            code=biz_code,
            data=None,
            message=message,
            status=HttpStatus.UNAUTHORIZED
        )

        # token 过期删除 cookie，浏览器收到 401 的同时，把本地过期的 access_token_cookie 删掉
        unset_jwt_cookies(response)

        return response
    # 校验通过，返回 None，表示继续执行视图函数
    return None
