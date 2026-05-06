## 项目概览

这是一个基于 Flask Application Factory 模式构建的后端项目，当前主要包含：

- 认证与会话接口
- 部门与用户相关接口
- JWT Cookie 鉴权
- Redis 验证码
- Flask-Babel 国际化
- pytest 分层测试

## 项目结构

```text
backend-flask/
├── app/                         # 主应用包
│   ├── __init__.py              # create_app() 应用工厂，组装应用
│   ├── commands.py              # Flask CLI 命令
│   ├── config.py                # development / testing / production 配置
│   ├── errors.py                # 全局异常处理
│   ├── extensions.py            # db、jwt、redis、limiter 等扩展初始化
│   ├── i18n.py                  # 国际化语言选择与 Babel 初始化
│   ├── enums/                   # 响应码、状态码等枚举
│   ├── models/                  # SQLAlchemy 模型
│   ├── schemas/                 # Pydantic 请求参数校验
│   ├── services/                # 业务服务层
│   ├── storage/                 # 文件存储抽象、图床实现与工厂
│   ├── tasks/                   # 后台任务 / 爬虫任务
│   ├── translations/            # Babel 翻译文件
│   ├── utils/                   # 通用工具模块（auth、db、response、request 等）
│   └── views/                   # Flask 蓝图 / 接口层
├── tests/                       # 测试目录
│   ├── conftest.py              # 共享 fixture 与测试公共装配
│   ├── helpers/                 # 测试辅助对象（如 FakeRedisClient）
│   ├── unit/                    # 单元测试：纯函数、小逻辑
│   ├── integration/             # 接口测试：完整请求链路
│   └── orm/                     # ORM / 事务测试
├── docs/                        # 专题文档
│   ├── testing.md               # 测试与覆盖率说明
│   ├── i18n.md                  # 国际化说明
│   └── deployment.md            # 部署说明
├── migrations/                  # Flask-Migrate / Alembic 迁移文件
├── scripts/                     # 辅助脚本
├── db/                          # 本地数据库相关文件或初始化脚本
├── logs/                        # 本地日志目录
├── app.py                       # 本地开发快捷启动入口
├── pyproject.toml               # Python 项目配置、依赖、pytest 配置
├── uv.lock                      # uv 锁文件
├── README.md                    # 项目总览文档
└── messages.pot                 # Babel 提取的翻译模板文件
```

### 结构说明

- `app/` 是核心业务代码目录，建议日常开发主要围绕这里展开。
- `app:create_app` 是当前项目的标准应用入口。
- `app.py` 作为本地开发快捷入口保留，适合在 PyCharm 中直接运行。
- `tests/` 按 `unit / integration / orm` 分层，方便局部执行和覆盖率统计。
- `docs/` 用于存放不适合长期堆在 README 中的专题文档。

## 超管账号

- name:boss
- pwd:boss

## 建表基础字段

- 必须字段：id（主键）、create_time（创建时间）、update_time（更新时间）
- 可选字段：create_by（创建者）、update_by（更新者）

## 生成 SECRET_KEY

- import secrets
- print(secrets.token_hex(32))

## 初始化数据库和创建超级管理员指令

- flask init-db

## 开发环境准备

```bash
uv sync
uv pip install -e .
```

说明：

- `uv sync` 用于安装依赖
- `uv pip install -e .` 用于把当前项目以 editable 模式安装到虚拟环境，避免本地导入路径问题

## 启动方式

推荐把 `app:create_app` 作为项目的标准入口。

- 标准开发启动方式：

```bash
uv run flask --app app:create_app --debug run --port 3001
```

- 本地快捷启动方式：

```bash
python app.py
```

说明：

- `app:create_app` 是当前项目的标准应用入口，适合写进文档、测试说明和部署配置
- `app.py` 可以继续保留，适合本地在 PyCharm 中直接点击运行
- 部署说明见 [docs/deployment.md](docs/deployment.md)

## 测试与覆盖率

- 先安装当前项目：`uv pip install -e .`
- 运行全部测试：`python -m pytest`
- 只运行某个测试文件：`python -m pytest tests/integration/test_auth_api.py`
- 只运行某个测试方法：`python -m pytest tests/integration/test_auth_api.py::test_login_success_sets_cookie`
- 查看详细输出：`python -m pytest -v`
- 详细说明见 [docs/testing.md](docs/testing.md)

## 代码质量

- 开发工具链：`ruff`、`mypy`、`pre-commit`
- 安装开发工具依赖：`uv sync --group dev`
- 详细说明见 [docs/code-quality.md](docs/code-quality.md)

## 国际化 i18n

- 项目使用 Flask-Babel 做接口文案国际化
- 常用命令：

```bash
pybabel extract -F babel.cfg -o messages.pot .
pybabel update -i messages.pot -d app/translations
pybabel compile -d app/translations
```

- 详细说明见 [docs/i18n.md](docs/i18n.md)

## 技术栈

- Python 3.12+
- Flask
- Flask-SQLAlchemy
- Flask-Migrate
- Flask-JWT-Extended
- Flask-Babel
- Redis
- Pydantic
- pytest
- uv

## 配置说明

- 开发环境：`.env.development`
- 测试环境：`.env.testing`
- 生产环境：通过真实环境变量注入

## API 说明

- 认证接口：`app/views/auth.py`
- 用户接口：`app/views/user.py`
- 部门接口：`app/views/department.py`
- 验证码接口：`app/views/captcha.py`

## 数据库与迁移

- 使用 Flask-Migrate / Alembic 管理迁移
- 迁移文件位于 `migrations/`
- 详细迁移流程可后续补充

## 部署

- 标准入口：`app:create_app`
- 生产部署建议见 [docs/deployment.md](docs/deployment.md)

## 开发规范

- 优先使用 Application Factory 模式
- 优先使用统一响应结构：`code / data / message`
- 优先使用 `success()` / `error()` 返回接口响应
- 优先使用 Pydantic schema 做请求校验
- 详细规范可后续补充

## Roadmap

- 注册与重置密码接口完善
- 更多接口测试与覆盖率补齐
- 部署流程进一步标准化
- 接口文档进一步补全
