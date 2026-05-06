import pytest

from app.utils.validators import validate_phone, validate_email

pytestmark = pytest.mark.unit


def test_validate_phone_valid():
    assert validate_phone("13800138000") is True


def test_validate_phone_invalid():
    assert validate_phone("123456") is False


def test_validate_email_valid():
    assert validate_email("test@example.com") is True


def test_validate_email_invalid():
    assert validate_email("bad-email") is False
