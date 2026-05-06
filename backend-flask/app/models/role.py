# from .. import db
from ..extensions import db
from .base import BaseModelMixin

# 多对多关联表:角色和菜单
role_menu_association = db.Table(
    'role_menu_association',
    db.Column('role_id', db.Integer, db.ForeignKey('roles.id')),
    db.Column('menu_id', db.Integer, db.ForeignKey('menus.id')),
)


class Role(BaseModelMixin, db.Model):
    """
    角色表模型
    """

    __tablename__ = 'roles'

    # 额外字段
    role_code = db.Column(
        db.String(64), unique=True, index=True, nullable=False, comment='角色编码'
    )
    name = db.Column(db.String(64), index=True, nullable=False, comment='角色名称')
    permission_char = db.Column(db.String(128), comment='权限字符')

    # 定义与 Menu 模型的多对多关系
    menus = db.relationship(
        'Menu', secondary=role_menu_association, backref=db.backref('roles', lazy='dynamic')
    )

    def __repr__(self):
        return f'<Role {self.name}>'
