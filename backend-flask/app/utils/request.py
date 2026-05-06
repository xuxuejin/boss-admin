from flask import request
from flask_babel import gettext as _
from werkzeug.exceptions import BadRequest
from pydantic import ValidationError


def _translate_validation_error(exc: ValidationError) -> str:
    first_error = exc.errors()[0]
    error_type = first_error.get("type")
    loc = ".".join(str(x) for x in first_error.get("loc", []))

    if error_type == "missing":
        return _("Missing required field: %(field)s", field=loc)
    if error_type == "string_too_short":
        return _("Field '%(field)s' is too short", field=loc)
    if error_type == "string_too_long":
        return _("Field '%(field)s' is too long", field=loc)
    if error_type == "greater_than_equal":
        return _("Field '%(field)s' is too small", field=loc)
    if error_type == "int_parsing":
        return _("Field '%(field)s' must be an integer", field=loc)
    if error_type == "value_error":
        return str(first_error.get("msg", _("Invalid value")))

    return _("Invalid request parameters")


def get_json_dict():
    data = request.get_json(silent=True)
    if data is None:
        raise BadRequest(_("Request body must be valid JSON"))
    if not isinstance(data, dict):
        raise BadRequest(_("Request body must be a JSON object"))
    return data


# 处理 request body JSON 参数
def parse_json_schema(schema_cls):
    data = get_json_dict()
    try:
        return schema_cls.model_validate(data)
    except ValidationError as exc:
        # first_error = exc.errors()[0]
        # # 加上 from exc 是为了保留异常链，日志里能看出 BadRequest 是由哪个底层异常转换来的
        # raise BadRequest(first_error["msg"]) from exc
        raise BadRequest(_translate_validation_error(exc)) from exc


def get_query_dict():
    return request.args.to_dict()


# 处理 query 参数
def parse_query_schema(schema_cls):
    data = get_query_dict()
    try:
        return schema_cls.model_validate(data)
    except ValidationError as exc:
        # first_error = exc.errors()[0]
        # raise BadRequest(first_error["msg"]) from exc
        raise BadRequest(_translate_validation_error(exc)) from exc


def get_form_dict():
    data = request.form.to_dict()
    if not data:
        raise BadRequest(_("Form data cannot be empty"))
    return data


# 处理 form 类型
def parse_form_schema(schema_cls):
    data = get_form_dict()
    try:
        return schema_cls.model_validate(data)
    except ValidationError as exc:
        # first_error = exc.errors()[0]
        # raise BadRequest(first_error["msg"]) from exc
        raise BadRequest(_translate_validation_error(exc)) from exc


# 文件上传
def get_uploaded_file(name: str, required: bool = True):
    file = request.files.get(name)
    if required and file is None:
        raise BadRequest(_("Missing uploaded file: %(name)s", name=name))
    return file
