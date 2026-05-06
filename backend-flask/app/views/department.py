from flask import Blueprint
from app.enums.response_codes import BizCode
from app.schemas.department import DepartmentCreateSchema, DepartmentUpdateSchema
from app.services import department_service
from app.utils.request import parse_json_schema
from app.utils.response import success

department_bp = Blueprint('department', __name__)


@department_bp.route('/department', methods=['GET'])
def get_departments():
    result = department_service.list_departments()
    return success(
        code=BizCode.SUCCESS,
        message=result["message"],
        data=result["data"],
    )


@department_bp.route('/department', methods=['POST'])
def add_department():
    payload = parse_json_schema(DepartmentCreateSchema)
    result = department_service.create_department(payload)

    return success(
        code=BizCode.SUCCESS,
        message=result["message"],
        data=result["data"],
    )


@department_bp.route('/department/<int:department_id>', methods=['PUT'])
def update_department(department_id):
    payload = parse_json_schema(DepartmentCreateSchema)
    result = department_service.update_department(department_id, payload)

    return success(
        code=BizCode.SUCCESS,
        message=result["message"],
        data=result["data"],
    )


@department_bp.route('/department/<int:department_id>', methods=['PATCH'])
def patch_department(department_id):
    payload = parse_json_schema(DepartmentUpdateSchema)
    result = department_service.update_department(department_id, payload)

    return success(
        code=BizCode.SUCCESS,
        message=result["message"],
        data=result["data"],
    )
