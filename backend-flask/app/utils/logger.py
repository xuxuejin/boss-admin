import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path

from flask import g, has_request_context, request


class RequestContextFilter(logging.Filter):
    def filter(self, record):
        record.request_id = '-'
        record.method = '-'
        record.path = '-'
        record.remote_addr = '-'

        if has_request_context():
            record.request_id = getattr(g, 'request_id', '-')
            record.method = request.method
            record.path = request.path
            record.remote_addr = request.headers.get('X-Forwarded-For', request.remote_addr or '-')

        return True


def setup_logger(app):
    log_level_name = app.config.get('LOG_LEVEL', 'INFO').upper()
    log_level = getattr(logging, log_level_name, logging.INFO)
    # 配置文件格式
    formatter = logging.Formatter(
        '%(asctime)s %(levelname)s [%(request_id)s] %(method)s %(path)s %(remote_addr)s '
        '%(message)s [in %(pathname)s:%(lineno)d]'
    )
    context_filter = RequestContextFilter()

    # 清空默认 handler（防止重复日志）
    app.logger.handlers.clear()
    app.logger.propagate = False  # 防止向 root logger 传播,避免日志打印两次

    # =========================
    # ✅ 控制台日志（永远开启）
    # =========================
    console_handler = logging.StreamHandler()
    console_handler.setLevel(log_level)
    console_handler.setFormatter(formatter)  # 修改 Flask 在 DEBUG 模式默认日志输出格式
    console_handler.addFilter(context_filter)
    app.logger.addHandler(console_handler)

    # 服务器环境记录日志文件
    # if not app.debug:
    # 根据配置决定是否启用文件日志
    if app.config.get('ENABLE_FILE_LOGGING', False):
        log_dir = Path(app.root_path).parent / app.config.get('LOG_DIR', 'logs')
        log_dir.mkdir(parents=True, exist_ok=True)

        app_log = log_dir / 'app.log'
        error_log = log_dir / 'error.log'
        app_handler = RotatingFileHandler(app_log, maxBytes=10_000_000, backupCount=5)
        # backupCount 指定日志文件轮转时保留的备份文件数量，app.log.1 到 app.log.5
        # 如果超过 backupCount，最早的备份文件（app.log.5）会被删除
        app_handler.setLevel(logging.INFO)
        app_handler.setFormatter(formatter)
        app_handler.addFilter(context_filter)
        app.logger.addHandler(app_handler)

        error_handler = RotatingFileHandler(error_log, maxBytes=10_000_000, backupCount=5)
        error_handler.setLevel(logging.ERROR)  # ✅ 只记录 ERROR+
        error_handler.setFormatter(formatter)
        error_handler.addFilter(context_filter)
        app.logger.addHandler(error_handler)

    app.logger.setLevel(log_level)
    # 获取 SQLAlchemy 引擎的日志器（sqlalchemy.engine），并将其日志级别设置为 WARNING，默认是 DEBUG 级别
    logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)

    return app.logger
