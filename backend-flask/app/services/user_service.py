from flask_babel import gettext as _

from app.enums.response_codes import BizCode, HttpStatus
from app.exceptions import BizError, StorageUploadError
from app.models.user import User
from app.repositories import user as user_repo
from app.storage.factory import build_image_storage
from app.utils.db import session_scope


def _get_user_role_codes(user: User) -> list[str]:
    return [role.role_code for role in user.roles if role.role_code]


def _get_user_permissions(user: User) -> list[str]:
    if user.is_admin:
        return ['*:*:*']
    permissions = []
    # for role in user.roles:
    return []


def get_current_user(user_id: int):
    user = user_repo.get_detail_by_id(user_id)
    if not user:
        raise BizError(
            code=BizCode.USER_NOT_FOUND,
            message=_('User not found'),
            status=HttpStatus.NOT_FOUND,
        )

    return {
        'user': user.to_dict(),
        'roles': _get_user_role_codes(user),
        'permissions': _get_user_permissions(user),
    }


def upload_current_user_avatar(user_id: int, file):
    with session_scope() as session:
        user = user_repo.get_by_id(user_id)
        if not user:
            raise BizError(
                code=BizCode.USER_NOT_FOUND,
                message=_('User not found'),
                status=HttpStatus.NOT_FOUND,
            )

        storage = build_image_storage()

        try:
            avatar_url = storage.upload_file(file)
        except StorageUploadError as exc:
            raise BizError(
                code=BizCode.INTERNAL_ERROR,
                message=_('Avatar upload failed, please try again later'),
                status=HttpStatus.INTERNAL_SERVER_ERROR,
            ) from exc
        user.avatar = avatar_url
        session.flush()
        session.refresh(user)

    return {
        'avatar': user.avatar,
        'user': user.to_dict(),
    }
