import os

from apscheduler.schedulers.background import BackgroundScheduler
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
scheduler = BackgroundScheduler(timezone='UTC')


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

    # 定时脚本
    # init_scheduler(app)


def register_commands(app):
    from .commands import init_db_command, test_command

    app.cli.add_command(init_db_command)
    app.cli.add_command(test_command)


def init_scheduler(app):
    """
    初始化 APScheduler
    """
    from app.tasks.crawl_task import crawl_mattress_job

    # 防止 debug 模式重复启动
    if app.debug and os.environ.get('WERKZEUG_RUN_MAIN') != 'true':
        return

    if scheduler.running:
        return

    scheduler.add_job(
        func=lambda: run_with_context(app, crawl_mattress_job),
        trigger='interval',
        hours=6,
        id='crawl_mattress',
        replace_existing=True,
    )

    scheduler.start()
    app.logger.info('APScheduler started.')
    # ⭐ 启动立即执行一次
    run_with_context(app, crawl_mattress_job)


def run_with_context(app, job_func):
    """
    保证 scheduler job 在 Flask app context 中执行
    """
    with app.app_context():
        job_func()
