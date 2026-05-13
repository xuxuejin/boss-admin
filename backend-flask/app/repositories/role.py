from sqlalchemy import select

from app.extensions import db
from app.models.role import Role


def list_all():
    stmt = select(Role).order_by(Role.id.asc())
    return db.session.execute(stmt).scalars().all()


def get_roles_by_id():
    pass
