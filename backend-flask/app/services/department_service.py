from flask_babel import gettext as _
from sqlalchemy.exc import IntegrityError

from app.exceptions import BizError
from app.enums.response_codes import BizCode, HttpStatus
from app.models.department import Department
from app.repositories import department as department_repo
from app.utils.db import session_scope


def list_departments():
    departments = department_repo.list_all()
    return {
        "data": [dept.to_dict() for dept in departments],
        "message": _("Departments fetched successfully"),
    }


def create_department(payload):
    department = Department(
        name=payload.name,
        order=payload.order,
        leader=payload.leader,
        phone=payload.phone,
        email=payload.email,
        status=payload.status,
        parent_id=payload.parent_id,
    )

    try:
        with session_scope() as session:
            department_repo.add(department, session=session)
            session.flush()
            session.refresh(department)
    except IntegrityError as exc:
        raise BizError(
            code=BizCode.DB_ERROR,
            message=_("Department name already exists"),
            status=HttpStatus.CONFLICT,
        ) from exc

    return {
        "data": department.to_dict(),
        "message": _("Department created successfully"),
    }


def update_department(dp_id, payload):
    try:
        with session_scope() as session:
            department = department_repo.get_by_id(dp_id, session)
            if not department:
                raise BizError(
                    code=BizCode.DEPARTMENT_NOT_FOUND,
                    message=_("Department not found"),
                    status=HttpStatus.NOT_FOUND,
                )

            data = payload.model_dump(exclude_unset=True)
            if not data:
                raise BizError(
                    code=BizCode.INVALID_PARAMS,
                    message=_("No fields to update"),
                    status=HttpStatus.BAD_REQUEST,
                )

            # 不能把自己设成自己的父部门
            parent_id = data.get("parent_id")
            if parent_id == dp_id:
                raise BizError(
                    code=BizCode.INVALID_PARAMS,
                    message=_("A department cannot be its own parent"),
                    status=HttpStatus.BAD_REQUEST,
                )

            # 如果指定了父部门，校验父部门是否存在
            if parent_id is not None:
                parent_department = department_repo.get_by_id(parent_id, session=session)
                if not parent_department:
                    raise BizError(
                        code=BizCode.INVALID_PARAMS,
                        message=_("Parent department not found"),
                        status=HttpStatus.BAD_REQUEST,
                    )

            department_repo.update(department, payload)
            session.flush()  # 把当前 session 里的改动发到数据库，但还没 commit
            session.refresh(department)  # 把数据库里的最新值重新读回当前对象，让内存里的对象和数据库保持一致
            # 走出 with 后 session.commit()
    except IntegrityError as exc:  # 针对这个异常要特别返回 409，其他的交给全局兜底
        raise BizError(
            code=BizCode.DB_ERROR,
            message=_("Department name already exists"),
            status=HttpStatus.CONFLICT,
        ) from exc

    return {
        "data": department.to_dict(),
        "message": _("Department updated successfully"),
    }
