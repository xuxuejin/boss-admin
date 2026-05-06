import pytest
from sqlalchemy.exc import IntegrityError

from app.extensions import db
from app.models.department import Department

pytestmark = pytest.mark.orm


def test_department_name_unique_constraint(app):
    with app.app_context():
        dept1 = Department(
            name="唯一部门",
            order=1,
            leader="A",
            phone="13800138000",
            email="a@example.com",
            status=1,
        )
        dept2 = Department(
            name="唯一部门",
            order=2,
            leader="B",
            phone="13900139000",
            email="b@example.com",
            status=1,
        )

        db.session.add(dept1)
        db.session.commit()

        db.session.add(dept2)
        with pytest.raises(IntegrityError):
            db.session.commit()

        db.session.rollback()


def test_department_create_time_generated(app):
    with app.app_context():
        dept = Department(
            name="时间部门",
            order=1,
            leader="A",
            phone="13800138000",
            email="time@example.com",
            status=1,
        )
        db.session.add(dept)
        db.session.commit()

        assert dept.create_time is not None
        assert isinstance(dept.create_time_ts, int)
