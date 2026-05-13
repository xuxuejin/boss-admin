from flask import Blueprint

role_bp = Blueprint('role', __name__)


@role_bp.route('/role', methods=['GET'])
def get_roles():
    # if admin_error:
    #     return admin_error

    # result = role_service.list_roles()
    # return success(code=BizCode.SUCCESS, data=result['data'], message=result['message'])
    return 'ok'
