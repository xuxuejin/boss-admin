from datetime import timedelta


def parse_expire_time(value):
    """
    将环境变量字符串解析成 timedelta
    支持格式: 10s, 5m, 12h, 7d
    """
    unit = value[-1]
    number = int(value[:-1])

    time_units = {
        's': timedelta(seconds=number),
        'm': timedelta(minutes=number),
        'h': timedelta(hours=number),
        'd': timedelta(days=number),
    }

    try:
        return time_units[unit]
    except KeyError as exc:
        raise ValueError(f'无效的时间格式: {value}') from exc
