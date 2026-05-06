import os
from pathlib import Path

from dotenv import load_dotenv

from app.utils.parse_time import parse_expire_time


def require_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f'Missing required environment variable: {name}')
    return value


BASE_DIR = Path(__file__).resolve().parent.parent
APP_ENV = os.getenv('APP_ENV', 'development')
ENV_FILE = BASE_DIR / f'.env.{APP_ENV}'

if APP_ENV in {'development', 'testing'} and ENV_FILE.exists():
    load_dotenv(ENV_FILE, override=True)


class BaseConfig:
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_POOL_SIZE = int(os.getenv('SQLALCHEMY_POOL_SIZE', 10))
    SQLALCHEMY_MAX_OVERFLOW = int(os.getenv('SQLALCHEMY_MAX_OVERFLOW', 5))

    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_DIR = os.getenv('LOG_DIR', 'logs')
    REQUEST_ID_HEADER = os.getenv('REQUEST_ID_HEADER', 'X-Request-ID')
    ENABLE_REQUEST_LOGGING = True
    ENABLE_FILE_LOGGING = False
    SLOW_REQUEST_THRESHOLD_MS = int(os.getenv('SLOW_REQUEST_THRESHOLD_MS', '1000'))

    JWT_TOKEN_LOCATION = ('cookies',)
    JWT_COOKIE_SAMESITE = os.getenv('JWT_COOKIE_SAMESITE', 'Lax')
    JWT_ACCESS_COOKIE_PATH = os.getenv('JWT_ACCESS_COOKIE_PATH', '/')
    JWT_COOKIE_CSRF_PROTECT = True
    # token 过期时间支持格式: 10s, 5m, 12h, 7d
    JWT_ACCESS_TOKEN_EXPIRES = parse_expire_time(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', '7d'))
    BABEL_DEFAULT_LOCALE = os.getenv('BABEL_DEFAULT_LOCALE', 'en')
    # 图床服务 key
    IMGBB_API_KEY = os.getenv('IMGBB_API_KEY')
    IMAGE_STORAGE_PROVIDER = os.getenv('IMAGE_STORAGE_PROVIDER', 'imgbb')


class DevelopmentConfig(BaseConfig):
    DEBUG = True
    JWT_COOKIE_SECURE = False
    SQLALCHEMY_ECHO = True

    LOG_LEVEL = 'DEBUG'
    ENABLE_FILE_LOGGING = True

    SECRET_KEY = require_env('SECRET_KEY')
    SQLALCHEMY_DATABASE_URI = require_env('SQLALCHEMY_DATABASE_URI')
    REDIS_URI = require_env('REDIS_URI')
    JWT_SECRET_KEY = require_env('JWT_SECRET_KEY')


class TestingConfig(BaseConfig):
    TESTING = True  # 进入测试模式
    JWT_COOKIE_SECURE = False
    RATELIMIT_ENABLED = False  # 避免限流影响测试结果

    SECRET_KEY = os.getenv('TEST_SECRET_KEY', 'test-secret')
    JWT_SECRET_KEY = os.getenv('TEST_JWT_SECRET_KEY', 'test-jwt-secret')
    SQLALCHEMY_DATABASE_URI = os.getenv(
        'TEST_DATABASE_URI', 'sqlite+pysqlite:///:memory:'
    )  # 临时测试库 不碰真实库
    REDIS_URI = os.getenv('TEST_REDIS_URI', 'memory://')


class ProductionConfig(BaseConfig):
    JWT_COOKIE_SECURE = True
    ENABLE_FILE_LOGGING = True

    SECRET_KEY = os.environ['SECRET_KEY']
    JWT_SECRET_KEY = os.environ['JWT_SECRET_KEY']
    SQLALCHEMY_DATABASE_URI = os.environ['SQLALCHEMY_DATABASE_URI']
    REDIS_URI = os.environ['REDIS_URI']


CONFIG_MAP = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
}


def get_config():
    return CONFIG_MAP[APP_ENV]
