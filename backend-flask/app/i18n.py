from flask import request, session
from flask_babel import Babel

babel = Babel()
SUPPORTED_LOCALES = ("en", "zh")


def get_locale():
    # 检查逻辑：?lang=zh > Cookie > 浏览器 Accept-Language
    lang = request.args.get("lang")
    if lang in SUPPORTED_LOCALES:
        return lang

    cookie_lang = request.cookies.get("lang")
    if cookie_lang in SUPPORTED_LOCALES:
        return cookie_lang

    return request.accept_languages.best_match(SUPPORTED_LOCALES) or "en"


def init_i18n(app):
    babel.init_app(app, locale_selector=get_locale)
