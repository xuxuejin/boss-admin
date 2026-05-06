# from .. import db
from ..extensions import db
from .base import BaseModelMixin


class Menu(BaseModelMixin, db.Model):
    """
    菜单表模型
    """
    __tablename__ = 'menus'

    # 额外字段
    name = db.Column(db.String(64), index=True, nullable=False, comment='菜单名称')
    icon = db.Column(db.String(64), comment='图标')
    sort_order = db.Column(db.Integer, comment='排序')
    permission_id = db.Column(db.String(128), index=True, comment='权限标识')
    component_path = db.Column(db.String(256), comment='组件路径')

    def __repr__(self):
        return f'<Menu {self.name}>'
