from enum import IntEnum, unique


@unique
class HttpStatus(IntEnum):
    OK = 200
    CREATED = 201
    ACCEPTED = 202
    NO_CONTENT = 204
    BAD_REQUEST = 400
    UNAUTHORIZED = 401
    FORBIDDEN = 403
    NOT_FOUND = 404
    METHOD_NOT_ALLOWED = 405
    CONFLICT = 409
    TOO_MANY_REQUESTS = 429
    INTERNAL_SERVER_ERROR = 500
    NOT_IMPLEMENTED = 501
    SERVICE_UNAVAILABLE = 503


@unique
class BizCode(IntEnum):
    # 成功码
    SUCCESS = 0
    # 通用错误码（例如参数错误）
    INVALID_PARAMS = 1001  # 无效参数
    CAPTCHA_ERROR = 1002  # 验证码错误
    # 用户相关错误
    USER_NOT_FOUND = 2001  # 用户未找到
    USER_DISABLED = 2002  # 用户已禁用
    USER_OR_PASSWORD_ERROR = 2003  # 用户或密码错误
    # 部门相关错误
    DEPARTMENT_NOT_FOUND = 2004
    # Token 错误
    TOKEN_INVALID = 3001  # Token 无效
    TOKEN_EXPIRED = 3002  # Token 过期
    PERMISSION_DENIED = 3003  # 权限不足
    # 系统内部错误
    INTERNAL_ERROR = 4001  # 系统内部错误
    DB_ERROR = 4002  # 数据库错误
