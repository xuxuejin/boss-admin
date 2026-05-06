from enum import unique

from ..extensions import db
from .base import BaseModelMixin


class Position(BaseModelMixin, db.Model):
    """
    职位表模型
    """
    __tablename__ = 'positions'

    # 额外字段
    name = db.Column(db.String(64), unique=True, nullable=False, comment="职位名称")
    post_code = db.Column(db.String(32), unique=True, comment='职位编码')
    level = db.Column(db.Integer, comment='职级，如：1-5级')

    def __repr__(self):
        return f'<Position {self.name}>'
