from enum import IntEnum

from flask import jsonify


def api_response(code: int | IntEnum, data=None, message='success', status: int | IntEnum = 200):
    response = jsonify(
        {
            'code': code,
            'data': data,
            'message': message,
        }
    )
    response.status_code = status
    return response


def success(code: int | IntEnum, data=None, message='success', status: int | IntEnum = 200):
    return api_response(code=code, data=data, message=message, status=status)


def error(code: int | IntEnum, message, status: int | IntEnum = 400, data=None):
    return api_response(code=code, data=data, message=message, status=status)
