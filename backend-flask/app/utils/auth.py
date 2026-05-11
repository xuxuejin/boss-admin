from flask import current_app, g, request
from flask_babel import gettext as _
from flask_jwt_extended import get_jwt_identity, unset_jwt_cookies, verify_jwt_in_request
from flask_jwt_extended.exceptions import JWTExtendedException
from jwt import ExpiredSignatureError

from app.enums.response_codes import BizCode, HttpStatus
from app.repositories import user as user_repo
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
    if request.method == 'OPTIONS' or request.endpoint == 'static':
        return None

    if request.endpoint is None:
        return None

    view = current_app.view_functions.get(request.endpoint)
    if view and getattr(view, '__is_public__', False):
        return None

    try:
        verify_jwt_in_request()
    except (ExpiredSignatureError, JWTExtendedException) as e:
        # 统一处理过期和无效
        message = (
            _('Login has expired, please log in again')
            if isinstance(e, ExpiredSignatureError)
            else _('Invalid login token')
        )
        biz_code = (
            BizCode.TOKEN_EXPIRED if isinstance(e, ExpiredSignatureError) else BizCode.TOKEN_INVALID
        )

        response = error_response(
            code=biz_code, data=None, message=message, status=HttpStatus.UNAUTHORIZED
        )

        # token 过期删除 cookie，浏览器收到 401 的同时，把本地过期的 access_token_cookie 删掉
        unset_jwt_cookies(response)

        return response

    try:
        user_id = int(get_jwt_identity())
    except (TypeError, ValueError):
        return error_response(
            code=BizCode.TOKEN_INVALID,
            data=None,
            message=_('Invalid login token'),
            status=HttpStatus.UNAUTHORIZED,
        )

    user = user_repo.get_by_id(user_id)
    if not user:
        return error_response(
            code=BizCode.USER_NOT_FOUND,
            data=None,
            message=_('User not found'),
            status=HttpStatus.NOT_FOUND,
        )

    g.current_user_id = user_id
    g.current_user = user
    # 校验通过 返回 None 表示继续执行视图函数
    return None


def require_admin():
    """
    校验当前用户是否为管理员。
    依赖 jwt_required_if_not_public 在 before_request 中写入的 g.current_user。
    """
    user = getattr(g, 'current_user', None)
    if not user:
        return error_response(
            code=BizCode.USER_NOT_FOUND,
            data=None,
            message=_('User not found'),
            status=HttpStatus.NOT_FOUND,
        )

    if not user.is_admin:
        return error_response(
            code=BizCode.PERMISSION_DENIED,
            data=None,
            message=_('Permission denied'),
            status=HttpStatus.FORBIDDEN,
        )

    return None
