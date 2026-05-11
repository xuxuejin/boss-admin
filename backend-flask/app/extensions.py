from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from redis import Redis, RedisError

from app.errors import register_error_handlers


class RedisExtension:
    def __init__(self):
        self._client: Redis | None = None

    def init_app(self, app):
        # 统一获取配置变量
        redis_uri = app.config.get('REDIS_URI')

        if not redis_uri:
            raise RuntimeError('REDIS_URI not found in app config')

        try:
            self._client = Redis.from_url(
                redis_uri, socket_connect_timeout=2, socket_timeout=2, decode_responses=True
            )
            self._client.ping()
            # 将自己挂载到 app.extensions 这是 Flask 插件的标准做法
            app.extensions['redis'] = self
            app.logger.info('Redis connected successfully.')
        except RedisError as e:
            app.logger.error(f'Redis initialization failed: {e}')
            raise

    def __getattr__(self, name):
        """将方法调用转发给底层的 Redis 客户端"""
        return getattr(self._client, name)


# 实例化所有扩展对象
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
redis_client = RedisExtension()
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=['100 per minute'],  # 设置默认的全局限速 每分钟100次
)


def setup_extensions(app):
    """
    负责初始化所有扩展并为应用注册错误处理函数。
    """
    redis_uri = app.config.get('REDIS_URI')

    # 初始化数据库
    db.init_app(app)

    # 初始化 migrate,关联 app 和 db
    migrate.init_app(app, db)

    # 初始化 JWT
    jwt.init_app(app)

    # 初始化 Redis
    redis_client.init_app(app)

    # 初始化限流器,将 Redis URI 添加到应用配置中,供 Limiter 使用
    app.config['RATELIMIT_STORAGE_URI'] = redis_uri
    limiter.init_app(app)

    # 注册全局错误兜底
    register_error_handlers(app)

    register_commands(app)


def register_commands(app):
    from .commands import crawl_mattress_command, init_db_command, run_scheduler_command, test_command

    app.cli.add_command(crawl_mattress_command)
    app.cli.add_command(init_db_command)
    app.cli.add_command(run_scheduler_command)
    app.cli.add_command(test_command)
