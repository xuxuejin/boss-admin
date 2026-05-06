# 部署说明

## 标准入口

当前项目使用 Flask Application Factory 模式，标准入口是：

```python
app: create_app
```

## 环境准备

推荐在部署环境中先安装项目，再启动应用：

```bash
uv pip install .
```

如果是开发机或测试机，也可以使用可编辑安装：

```bash
uv pip install -e .
```

说明：

- `uv pip install .` 适合正式部署环境
- `uv pip install -e .` 适合本地开发和测试环境
- 这样做的目的是让 `app` 包在当前 Python 环境中可稳定导入，避免路径问题

## 环境变量

生产环境不依赖项目内的 `.env.production`，而是通过运行环境注入环境变量。

不同环境的配置来源建议统一约定为：

- development
    - 使用 `.env.development`
- testing
    - 使用 `.env.testing`
    - 或测试配置类默认值
- production
    - 使用部署平台注入的环境变量 / Secret
    - 不依赖仓库中的 `.env.production`

至少需要提供：

- `APP_ENV=production`
- `SECRET_KEY`
- `JWT_SECRET_KEY`
- `SQLALCHEMY_DATABASE_URI`
- `REDIS_URI`

推荐同时提供这些运行配置：

- `LOG_LEVEL`
- `LOG_DIR`
- `REQUEST_ID_HEADER`
- `ENABLE_FILE_LOGGING`
- `SLOW_REQUEST_THRESHOLD_MS`

同一环境下的多个实例应共享同一套：

- `SECRET_KEY`
- `JWT_SECRET_KEY`

否则会出现：

- Cookie / CSRF / Session 验签不一致
- 不同实例之间 JWT 无法互相校验

一个较完整的生产环境变量示例如下：

```env
APP_ENV=production
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret-key
SQLALCHEMY_DATABASE_URI=mysql+pymysql://user:password@db:3306/flask_boss
REDIS_URI=redis://redis:6379/0
LOG_LEVEL=INFO
LOG_DIR=logs
REQUEST_ID_HEADER=X-Request-ID
ENABLE_FILE_LOGGING=True
SLOW_REQUEST_THRESHOLD_MS=1000
```

## 本地开发启动

推荐命令：

```bash
uv run flask --app app:create_app run --debug --port 3001
```

## 生产部署启动

推荐使用 Gunicorn，直接调用应用工厂：

```bash
gunicorn 'app:create_app()'
```

如果需要指定绑定地址和 worker 数量，可以写成：

```bash
gunicorn 'app:create_app()' --bind 0.0.0.0:3001 --workers 4
```

## Docker / 容器部署建议

如果后续使用 Docker 或其他容器平台，建议：

1. 在镜像构建或容器启动阶段安装项目
2. 通过环境变量或 Secret 注入配置
3. 用 Gunicorn 调用 `app:create_app()`

不要把真实密钥直接写进：

- `Dockerfile`
- 仓库中的 `.env.production`

更推荐：

- Docker Compose `environment`
- Docker Compose `env_file`
- Kubernetes Secret
- 云平台 Secret Manager

## 测试入口

测试不依赖 `app.py`，推荐入口：

```bash
uv pip install -e .
python -m pytest
```

或者：

```bash
uv run pytest
```

详细说明见 [testing.md](testing.md)

## 推荐约定

为了避免入口混乱，建议统一约定：

- 标准应用入口：`app:create_app`
- 本地开发快捷入口：`app.py`
- 测试入口：`python -m pytest` / `uv run pytest`
- 生产部署入口：`gunicorn 'app:create_app()'`
