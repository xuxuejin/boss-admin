import pytest

from app.utils.captcha import Captcha

pytestmark = pytest.mark.unit


def test_generate_captcha_base64(fake_redis):
    captcha = Captcha(fake_redis)
    captcha_id, base64_data = captcha.generate_captcha_base64()

    assert isinstance(captcha_id, str)
    assert len(captcha_id) == 32
    assert isinstance(base64_data, str)
    assert len(base64_data) > 0


def test_verify_captcha_success(fake_redis):
    captcha = Captcha(fake_redis)
    fake_redis.setex("captcha:test-id", 60, "ABCD")

    assert captcha.verify_captcha("test-id", "abcd") is True


def test_verify_captcha_failure(fake_redis):
    captcha = Captcha(fake_redis)
    fake_redis.setex("captcha:test-id", 60, "ABCD")

    assert captcha.verify_captcha("test-id", "xxxx") is False
