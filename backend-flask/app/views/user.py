from flask import Blueprint
from flask_babel import gettext as _
from flask_jwt_extended import get_jwt_identity

from app.enums.response_codes import BizCode
from app.services import user_service
from app.utils.request import get_uploaded_file
from app.utils.response import error, success

user_bp = Blueprint('user', __name__)


@user_bp.route('/users/me', methods=['GET'])
def get_current_user():
    """
    获取当前登录用户信息
    :return:
    """
    user_id = int(get_jwt_identity())

    user_data = user_service.get_current_user(user_id)

    return success(
        code=BizCode.SUCCESS,
        data=user_data,
        message=_('Success'),
    )


@user_bp.route('/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    """
    获取指定用户信息
    :param user_id:
    :return:
    """
    return error(
        code=BizCode.INTERNAL_ERROR,
        message=_('This endpoint is not implemented yet'),
        data=None,
        status=501,
    )


@user_bp.route('/users', methods=['GET'])
def list_users():
    """
    获取用户列表
    :return:
    """
    return error(
        code=BizCode.INTERNAL_ERROR,
        message=_('This endpoint is not implemented yet'),
        data=None,
        status=501,
    )


@user_bp.route('/users/me/avatar', methods=['POST'])
def upload_my_avatar():
    """
    上传当前用户头像
    :return:
    """
    user_id = int(get_jwt_identity())
    file = get_uploaded_file('avatar')
    user_service.upload_current_user_avatar(user_id, file)

    return success(
        code=BizCode.SUCCESS,
        data=None,
        message=_('Avatar uploaded successfully'),
    )
