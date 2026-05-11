from flask import Blueprint

from app.enums.response_codes import BizCode
from app.services import role_service
from app.utils.auth import require_admin
from app.utils.response import success

role_bp = Blueprint('role', __name__)


@role_bp.route('/role', methods=['GET'])
def get_roles():
    admin_error = require_admin()
    if admin_error:
        return admin_error

    result = role_service.list_roles()
    return success(code=BizCode.SUCCESS, data=result['data'], message=result['message'])
