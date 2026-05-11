from sqlalchemy import select

from app.extensions import db
from app.models.department import Department


def list_all() -> list[Department]:
    return db.session.scalars(
        select(Department).order_by(Department.id.asc())
    ).all()


def get_by_id(dp_id: int, session=None) -> Department | None:
    current_session = session or db.session
    return current_session.execute(
        select(Department).where(Department.id == dp_id)
    ).scalar_one_or_none()


def get_by_name(name: str, session=None) -> Department | None:
    current_session = session or db.session
    return current_session.execute(
        select(Department).where(Department.name == name)
    ).scalar_one_or_none()


def add(department: Department, session=None) -> None:
    current_session = session or db.session
    current_session.add(department)


def update(department: Department, payload) -> Department:
    allowed_fields = {"name", "order", "leader", "phone", "email", "status", "parent_id"}
    data = payload.model_dump(exclude_unset=True)

    for field, value in data.items():
        if field in allowed_fields:
            setattr(department, field, value)

    return department
