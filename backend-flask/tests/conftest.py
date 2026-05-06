import pytest

# import app.models 是为了触发副作用，让所有模型模块被 import，SQLAlchemy 才能把这些模型注册进 metadata，后面的 db.create_all() 才知道要建哪些表
# 否则可能出现 db.create_all() 执行了，但某些模型对应的表根本没创建
import app.models as _models  # noqa: F401
from app import create_app
from app.config import TestingConfig
from app.extensions import db, redis_client
from app.models.user import User
from app.utils.captcha import Captcha
from tests.helpers.fake_redis import FakeRedisClient


@pytest.fixture
def fake_redis():
    return FakeRedisClient()


@pytest.fixture
def app(monkeypatch, fake_redis):
    def fake_init_app(flask_app):
        redis_client._client = fake_redis
        flask_app.extensions["redis"] = redis_client

    # 把原本真实的 redis_client.init_app 临时替换成测试版本 fake_init_app，这样应用启动时就不会真的连 Redis
    monkeypatch.setattr(redis_client, "init_app", fake_init_app)

    app = create_app(TestingConfig)

    with app.app_context():
        db.drop_all()
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


# 预先创建测试用户，很多登录/鉴权测试都要用
@pytest.fixture
def test_user(app):
    with app.app_context():
        user = User(
            username="boss",
            nickname="Boss",
            phone_number="17600000000",
            email="boss@example.com",
            is_admin=True,
            gender=1,
        )
        user.set_password("boss123")
        db.session.add(user)
        db.session.commit()
        return {
            "id": user.id,
            "username": user.username,
            "password": "boss123",
        }


# 封装登录动作，测试里直接 login() 就行，不用每次手写请求体
@pytest.fixture
def login(client, monkeypatch):
    def _login(username="boss", password="boss123"):
        # 把验证码校验直接改成恒为成功 登录测试不需要真的生成验证码
        monkeypatch.setattr(
            Captcha,
            "verify_captcha",
            lambda self, captcha_id, captcha_code: True,
        )

        response = client.post(
            "/api/auth/login",
            json={
                "username": username,
                "password": password,
                "captcha_id": "test-captcha-id",
                "captcha_code": "ABCD",
            },
        )
        return response

    return _login


# 自动完成登录并提取 CSRF header，后续受保护接口复用
@pytest.fixture
def auth_headers(client, login, test_user):
    response = login(username=test_user["username"], password=test_user["password"])
    assert response.status_code == 200

    csrf_cookie = client.get_cookie("csrf_access_token")
    assert csrf_cookie is not None

    return {
        "X-CSRF-TOKEN": csrf_cookie.value,
    }
