from flask import Blueprint
from redis import RedisError
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.enums.response_codes import BizCode, HttpStatus
from app.extensions import db, redis_client
from app.security.auth import public_route
from app.utils.response import error, success

health_bp = Blueprint('health', __name__, url_prefix='/health')


@health_bp.route('/live', methods=['GET'])
@public_route
def liveness():
    return success(
        code=BizCode.SUCCESS,
        data={'status': 'up'},
        message='ok',
        status=HttpStatus.OK,
    )


@health_bp.route('/ready', methods=['GET'])
@public_route
def readiness():
    checks = {
        'database': 'up',
        'redis': 'up',
    }

    try:
        db.session.execute(text('SELECT 1'))
    except SQLAlchemyError:
        checks['database'] = 'down'

    try:
        redis_client.ping()
    except RedisError:
        checks['redis'] = 'down'

    overall_up = all(value == 'up' for value in checks.values())
    if overall_up:
        return success(
            code=BizCode.SUCCESS,
            data={'status': 'up', 'checks': checks},
            message='ok',
            status=HttpStatus.OK,
        )

    return error(
        code=BizCode.INTERNAL_ERROR,
        data={'status': 'degraded', 'checks': checks},
        message='service not ready',
        status=HttpStatus.SERVICE_UNAVAILABLE,
    )
