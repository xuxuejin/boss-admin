import pytest
from datetime import timedelta

from app.utils.parse_time import parse_expire_time

pytestmark = pytest.mark.unit


def test_parse_expire_time_seconds():
    assert parse_expire_time("10s") == timedelta(seconds=10)


def test_parse_expire_time_minutes():
    assert parse_expire_time("15m") == timedelta(minutes=15)


def test_parse_expire_time_hours():
    assert parse_expire_time("2h") == timedelta(hours=2)


def test_parse_expire_time_days():
    assert parse_expire_time("7d") == timedelta(days=7)


def test_parse_expire_time_invalid():
    with pytest.raises(ValueError):
        parse_expire_time("10x")
