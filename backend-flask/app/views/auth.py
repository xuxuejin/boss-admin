from flask import Blueprint
from flask_babel import gettext as _
from flask_jwt_extended import unset_jwt_cookies, get_jwt_identity, set_access_cookies
from app.extensions import limiter, redis_client
from app.enums.response_codes import HttpStatus, BizCode
from app.utils.auth import public_route
from app.utils.request import parse_json_schema
from app.schemas.auth import LoginSchema
from app.services import auth_service
from app.utils.response import success, error

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')


@auth_bp.route('/login', methods=['POST'])
@limiter.limit("5 per 1 minute")  # 为登录路由添加限流，防止暴力破解
@public_route
def login_user():
    """
    用户登录接口
    :return: 包含访问令牌的 json 响应
    """
    payload = parse_json_schema(LoginSchema)

    access_token = auth_service.login(payload, redis_client)

    response = success(
        code=BizCode.SUCCESS,
        data=None,
        message=_("Login successful"),
        status=HttpStatus.OK,
    )
    set_access_cookies(response, access_token)
    return response


@auth_bp.route('/session', methods=['GET'])
@limiter.limit("5 per 1 minute")
def user_session():
    """
    用户会话信息
    :return: 包含当前会话用户信息
    """

    user_id = int(get_jwt_identity())

    user_data = auth_service.get_session_user(user_id)

    return success(
        code=BizCode.SUCCESS,
        data=user_data,
        message=_("Success"),
        status=HttpStatus.OK,
    )


@auth_bp.route("/register", methods=["POST"])
@public_route
def register_user():
    """
    用户注册接口
    :return: JSON响应
    """
    return error(
        code=BizCode.INTERNAL_ERROR,
        message=_("This endpoint is not implemented yet"),
        data=None,
        status=501
    )


@auth_bp.route("/logout", methods=["POST"])
def logout_user():
    """
    用户注销接口
    """
    response = success(
        code=BizCode.SUCCESS,
        data=None,
        message=_("Logout successful"),
        status=HttpStatus.OK
    )
    unset_jwt_cookies(response)
    return response


@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    """
    密码重置接口，需要用户已登录并提供旧密码
    :return: JSON响应
    """
    return error(
        code=BizCode.INTERNAL_ERROR,
        message=_("This endpoint is not implemented yet"),
        data=None,
        status=501
    )
