from sqlalchemy import select
from sqlalchemy.orm import joinedload, selectinload

from app.extensions import db
from app.models.user import User


def get_by_username(username: str) -> User | None:
    return db.session.execute(
        select(User).where(User.username == username)
    ).scalar_one_or_none()


def get_by_id(user_id: int) -> User | None:
    return db.session.get(User, user_id)


def get_detail_by_id(user_id: int) -> User | None:
    stmt = (
        select(User)
        .options(
            joinedload(User.positions),
            selectinload(User.roles),
        )
        .where(User.id == user_id)
    )
    return db.session.execute(stmt).scalar_one_or_none()
