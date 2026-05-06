import pytest

from app.extensions import db
from app.models.department import Department
from app.utils.db import session_scope

pytestmark = pytest.mark.orm


def test_session_scope_commit(app):
    with app.app_context():
        with session_scope() as session:
            session.add(
                Department(
                    name="测试部门",
                    order=1,
                    leader="Tom",
                    phone="13800138000",
                    email="test@example.com",
                    status=1,
                )
            )

        dept = db.session.query(Department).filter_by(name="测试部门").first()
        assert dept is not None


def test_session_scope_rollback_on_exception(app):
    with app.app_context():
        with pytest.raises(ValueError):
            with session_scope() as session:
                session.add(
                    Department(
                        name="回滚部门",
                        order=1,
                        leader="Tom",
                        phone="13800138000",
                        email="rollback@example.com",
                        status=1,
                    )
                )
                raise ValueError("force rollback")

        dept = db.session.query(Department).filter_by(name="回滚部门").first()
        assert dept is None
