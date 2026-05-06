import os
from flask import Flask, Blueprint


def register_blueprints(app: Flask):
    """
    动态注册 app/views 目录下的所有蓝图
    所有蓝图都将自动添加 '/api' 作为 URL 前缀
    """
    # 动态获取蓝图文件所在的目录
    blueprint_dir = os.path.dirname(__file__)
    # 遍历目录下所有文件和子目录
    for item_name in os.listdir(blueprint_dir):
        if item_name.endswith('.py') and not item_name.startswith('__'):
            module_name = item_name[:-3]

            try:
                # 动态导入蓝图模块
                module = __import__(f'app.views.{module_name}', fromlist=[''])  # from app.views.user import *
                # 约定蓝图实例变量名为 <模块名>_bp
                blueprint_name = f'{module_name}_bp'

                # 检查 module 对象是否有一个名为 <模块名>_bp 的属性，确保蓝图实例确实存在于模块中
                if hasattr(module, blueprint_name) and isinstance(getattr(module, blueprint_name), Blueprint):
                    blueprint_instance = getattr(module, blueprint_name)
                    # 在这里统一添加 '/api' 前缀
                    # app.register_blueprint(blueprint_instance, url_prefix='/api')
                    # 兼容添加自定义前缀的情况
                    app.register_blueprint(blueprint_instance, url_prefix=f'/api{blueprint_instance.url_prefix or ""}')
                    app.logger.info(f"Registered blueprint: {blueprint_instance.name} with prefix '/api'")
                else:
                    app.logger.warning(f"文件 '{item_name}' 不包含名为 '{blueprint_name}' 的蓝图实例。")

            except ImportError as e:
                app.logger.error(f"导入蓝图模块 '{module_name}' 失败: {e}")
            except Exception as e:
                app.logger.error(f"注册蓝图 '{module_name}' 时发生错误: {e}")
