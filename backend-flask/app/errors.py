from flask import request
from flask_babel import gettext as _
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from flask_jwt_extended import exceptions
from werkzeug.exceptions import HTTPException, BadRequest, Conflict
from redis import RedisError
from app.exceptions import BizError
from app.enums.response_codes import HttpStatus, BizCode
from app.utils.response import error as error_response


def register_error_handlers(app):
    @app.errorhandler(BadRequest)
    def handle_bad_request(error):
        app.logger.warning("400 %s %s", request.method, request.path)
        return error_response(
            code=BizCode.INVALID_PARAMS,
            data=None,
            message=_("Invalid request parameters"),
            status=HttpStatus.BAD_REQUEST
        )

    @app.errorhandler(Conflict)
    def handle_conflict(error):
        app.logger.warning("409 %s %s", request.method, request.path)
        return error_response(
            code=BizCode.INVALID_PARAMS,
            data=None,
            message=_("Resource conflict"),
            status=HttpStatus.CONFLICT
        )

    @app.errorhandler(IntegrityError)
    def handle_integrity_error(error):
        app.logger.warning("IntegrityError on %s %s: %s", request.method, request.path, error)
        return error_response(
            code=BizCode.DB_ERROR,
            data=None,
            message=_("Data conflict, please check unique constraints or relations"),
            status=HttpStatus.CONFLICT
        )

    @app.errorhandler(SQLAlchemyError)
    def handle_sqlalchemy_error(error):
        app.logger.exception("SQLAlchemyError on %s %s", request.method, request.path)
        return error_response(
            code=BizCode.DB_ERROR,
            data=None,
            message=_("Database operation failed"),
            status=HttpStatus.INTERNAL_SERVER_ERROR
        )

    # JWT 错误处理，捕获无效令牌错误，返回 JSON 响应
    @app.errorhandler(exceptions.JWTExtendedException)
    def handle_jwt_error(error):
        app.logger.warning("JWT error on %s %s: %s", request.method, request.path, error)
        return error_response(
            code=BizCode.TOKEN_INVALID,
            data=None,
            message=_("Invalid login token"),
            status=HttpStatus.UNAUTHORIZED
        )

    # 处理 redis 异常
    @app.errorhandler(RedisError)
    def handle_redis_error(error):
        app.logger.exception("RedisError on %s %s", request.method, request.path)
        return error_response(
            code=BizCode.INTERNAL_ERROR,
            data=None,
            message=_("Cache service error"),
            status=HttpStatus.INTERNAL_SERVER_ERROR
        )

    # 统一处理业务错误，service 里 raise BizError(...) 后，能自动统一返回 JSON
    @app.errorhandler(BizError)
    def handle_biz_error(error):
        if 400 <= int(error.status) < 500:
            app.logger.warning("BizError on %s %s: %s", request.method, request.path, error.message)
        else:
            app.logger.exception("BizError on %s %s: %s", request.method, request.path, error.message)

        return error_response(
            code=error.code,
            data=error.data,
            message=error.message,
            status=error.status,
        )

    # 所有 HTTP 异常（404, 429, 500, 400...）统一处理
    @app.errorhandler(HTTPException)
    def handle_http_error(error):
        if 400 <= error.code < 500:
            app.logger.warning("HTTP %s on %s %s: %s", error.code, request.method, request.path, error)
        else:
            app.logger.exception("HTTP %s on %s %s", error.code, request.method, request.path)

        default_messages = {
            400: _("Bad request"),
            401: _("Unauthorized"),
            403: _("Forbidden"),
            404: _("Not found"),
            405: _("Method not allowed"),
            409: _("Conflict"),
            429: _("Too many requests"),
            500: _("Internal server error"),
        }

        return error_response(
            code=error.code,
            data=None,
            message=default_messages.get(error.code, _("Request failed")),
            status=error.code
        )

    # 兜底：所有非 HTTP 异常（Python 错误、数据库错误等）
    @app.errorhandler(Exception)
    def handle_unexpected_error(error):
        app.logger.exception("Unhandled error on %s %s", request.method, request.path)
        return error_response(
            code=BizCode.INTERNAL_ERROR,
            data=None,
            message=_("Internal server error"),
            status=HttpStatus.INTERNAL_SERVER_ERROR
        )
