from flask import Flask, g, request
from time import perf_counter
from uuid import uuid4
from .config import get_config
from .utils.logger import setup_logger
from .utils.auth import jwt_required_if_not_public
from .views import register_blueprints
from .extensions import setup_extensions
from .i18n import init_i18n


def create_app(config_object=None):
    app = Flask(__name__)
    # 关键配置：禁用 ASCII 强制转换，JSON 默认会把非 ASCII 字符转义成 \uXXXX
    # app.json.ensure_ascii = False
    app.config.from_object(config_object or get_config())

    # 初始化日志
    setup_logger(app)

    # 初始化数据库
    try:
        setup_extensions(app)  # 初始化 db、Redis、Limiter、JWT 等
    except Exception as e:
        app.logger.error(f"Critical extension initialization failed: {e}")
        raise  # 初始化失败，则抛出异常，阻止应用启动

    # 注册蓝图
    register_blueprints(app)
    # 初始化语言
    init_i18n(app)

    @app.before_request
    def before_request():
        g.request_id = request.headers.get(
            app.config.get("REQUEST_ID_HEADER", "X-Request-ID"),
            str(uuid4()),
        )
        g.request_started_at = perf_counter()
        if app.config.get("ENABLE_REQUEST_LOGGING", True):
            app.logger.info("Request started")
        return jwt_required_if_not_public()

    @app.after_request
    def after_request(response):
        duration_ms = 0.0
        if hasattr(g, "request_started_at"):
            duration_ms = round((perf_counter() - g.request_started_at) * 1000, 2)

        response.headers[app.config.get("REQUEST_ID_HEADER", "X-Request-ID")] = g.request_id

        if app.config.get("ENABLE_REQUEST_LOGGING", True):
            threshold = app.config.get("SLOW_REQUEST_THRESHOLD_MS", 1000)
            if duration_ms >= threshold:
                app.logger.warning(
                    "Request finished with status=%s duration_ms=%s slow=true",
                    response.status_code,
                    duration_ms,
                )
            else:
                app.logger.info(
                    "Request finished with status=%s duration_ms=%s",
                    response.status_code,
                    duration_ms,
                )

        return response

    return app
