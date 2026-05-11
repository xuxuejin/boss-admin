from datetime import UTC, datetime

from app.extensions import db


class BaseModelMixin(db.Model):
    """
    所有数据库模型的基础类,提供了通用的基础字段。
    """

    __abstract__ = True  # 👈 非常重要 表示这是抽象类 不会建表
    id = db.Column(db.Integer, primary_key=True, autoincrement=True, comment='主键ID')
    # 如果直接写 default=datetime.now(timezone.utc) 这个时间会在模型类定义时就被执行 而不是在插入数据时执行
    # 所以要用 lambda 或函数名 不加括号 来延迟执行
    create_time = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
        comment='创建时间',
    )
    update_time = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
        onupdate=lambda: datetime.now(UTC),
        comment='更新时间',
    )
    create_by = db.Column(db.String(46), comment='创建者')
    update_by = db.Column(db.String(46), comment='更新者')

    @staticmethod
    def datetime_to_ts_ms(dt):
        if dt is None:
            return None
        if dt.tzinfo is None:
            # 数据库存的是无时区时间 2026-04-14 09:27:38 没有时区信息
            # 如果直接对“无时区 datetime”做 .timestamp() Python 会按服务器本地时区解释，结果可能偏 8 小时
            dt = dt.replace(tzinfo=UTC)  # 恢复 UTC 语义
        return int(dt.timestamp() * 1000)

    @property
    def create_time_ts(self):
        return self.datetime_to_ts_ms(self.create_time)

    @property
    def update_time_ts(self):
        return self.datetime_to_ts_ms(self.update_time)
