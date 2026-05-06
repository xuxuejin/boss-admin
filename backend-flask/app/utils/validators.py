import re

PHONE_PATTERN = re.compile(r'^1[3-9]\d{9}$')
EMAIL_PATTERN = re.compile(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$')


def validate_phone(phone):
    if not phone: return False
    return bool(PHONE_PATTERN.match(phone))


def validate_email(email):
    if not email: return False
    return bool(EMAIL_PATTERN.match(email))
