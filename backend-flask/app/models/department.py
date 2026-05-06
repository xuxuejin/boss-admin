from ..extensions import db
from .base import BaseModelMixin


class Department(BaseModelMixin, db.Model):
    """
    部门表模型
    """
    __tablename__ = 'departments'

    # 基本字段
    name = db.Column(db.String(64), unique=True, index=True, nullable=False, comment='部门名称')
    order = db.Column(db.Integer, default=0, nullable=False, comment='显示顺序')
    leader = db.Column(db.String(128), nullable=True, comment='负责人')
    phone = db.Column(db.String(32), nullable=True, comment='联系电话')
    email = db.Column(db.String(64), nullable=True, comment='邮箱')
    status = db.Column(db.SmallInteger, default=1, nullable=False, comment='状态：1=启用, 0=禁用')

    # 自引用字段，用于构建树状结构
    parent_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=True, comment='上级部门ID')

    # 定义与 User 模型的关系
    users = db.relationship('User', backref='department', lazy='dynamic')

    # 定义自引用关系，用于获取子部门
    children = db.relationship(
        'Department',
        backref=db.backref('parent', remote_side='Department.id'),
        lazy='dynamic'
    )

    def __repr__(self):
        return f'<Department {self.name}>'

    def to_dict(self, include=None, exclude=None):
        default_fields = [
            'id',
            'parent_id',
            'name',
            'order',
            'leader',
            'phone',
            'email',
            'status',
            'create_time'
        ]
        if include is not None:
            fields = [f for f in include if hasattr(self, f)]
        else:
            fields = default_fields
            if exclude is not None:
                fields = [f for f in fields if f not in exclude]

        data = {}
        for field in fields:
            if field == 'create_time':
                data[field] = self.create_time_ts
            elif field == 'update_time':
                data[field] = self.update_time_ts
            else:
                data[field] = getattr(self, field, None)
        return data
