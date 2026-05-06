import pytest
from datetime import datetime, timezone

from app.models.base import BaseModelMixin

pytestmark = pytest.mark.unit


def test_datetime_to_ts_ms_with_aware_utc():
    dt = datetime(2026, 1, 1, 0, 0, 0, tzinfo=timezone.utc)
    ts = BaseModelMixin.datetime_to_ts_ms(dt)
    assert ts == int(dt.timestamp() * 1000)


def test_datetime_to_ts_ms_with_naive_datetime_treated_as_utc():
    dt = datetime(2026, 1, 1, 0, 0, 0)
    ts = BaseModelMixin.datetime_to_ts_ms(dt)
    expected = int(dt.replace(tzinfo=timezone.utc).timestamp() * 1000)
    assert ts == expected
