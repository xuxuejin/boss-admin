from werkzeug.security import check_password_hash, generate_password_hash

from app.extensions import db

from .base import BaseModelMixin

# 多对多关联表:用户和角色
user_role_association = db.Table(
    'user_role_association',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id')),
    db.Column('role_id', db.Integer, db.ForeignKey('roles.id')),
)


class User(BaseModelMixin, db.Model):
    """
    用户表模型
    """

    __tablename__ = 'users'

    username = db.Column(db.String(64), unique=True, nullable=False, index=True, comment='用户姓名')
    nickname = db.Column(db.String(64), comment='用户昵称')
    avatar = db.Column(db.String(255), comment='用户头像URL')
    # 部门关联,一对多关系
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), comment='所属部门ID')
    position_id = db.Column(db.Integer, db.ForeignKey('positions.id'), comment='所属岗位ID')
    # 联系方式
    phone_number = db.Column(db.String(32), unique=True, index=True, comment='手机号')
    email = db.Column(db.String(64), unique=True, index=True, comment='用户邮箱')
    # 认证和权限相关字段
    password = db.Column(db.String(255), nullable=False, comment='密码哈希值')
    is_admin = db.Column(db.Boolean, default=False, comment='是否为管理员')

    # 业务字段
    gender = db.Column(db.SmallInteger, comment='性别:1=男, 2=女, 0=未知')
    login_ip = db.Column(db.String(64), comment='上次登录IP')

    # 定义与 Role 模型的多对多关系,通过 user_role_association 中间表关联起来
    roles = db.relationship(
        'Role', secondary=user_role_association, backref=db.backref('users', lazy='dynamic')
    )

    positions = db.relationship(
        'Position', backref=db.backref('users', lazy='dynamic'), uselist=False
    )

    # def __init__(self, **kwargs):
    #     # 调用父类的构造函数
    #     super(User, self).__init__(**kwargs)

    def __repr__(self):
        return f'<User {self.username}>'

    def to_dict(self, include=None, exclude=None):
        """
        将用户模型转换为字典,安全地返回给前端

        参数:
            include: 指定要包含的字段列表(白名单方式)
            exclude: 指定要排除的字段列表(黑名单方式)

        示例:
            user.to_dict()                    # 返回常用安全字段
            user.to_dict(include=['username', 'phone_number', 'department_id'])
            user.to_dict(exclude=['password', 'login_ip'])
        """
        # 默认返回的安全字段
        default_fields = [
            'id',
            'username',
            'nickname',
            'avatar',
            'phone_number',
            'email',
            'department_id',
            'position_id',
            'gender',
            'is_admin',
        ]
        if include is not None:
            fields = [f for f in include if hasattr(self, f)]
        else:
            fields = default_fields
            if exclude:
                fields = [f for f in fields if f not in exclude]
        data = {}
        for field in fields:
            value = getattr(self, field, None)

            # 特殊字段处理
            if field == 'roles':
                data['roles'] = [role.name for role in self.roles] if self.roles else []
            elif field == 'position_id':
                data['position_id'] = self.position_id
                data['position_name'] = self.positions.name if self.positions else None
            else:
                data[field] = value

        return data

    def set_password(self, password):
        self.password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)
