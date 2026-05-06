# Boss Admin

`boss-admin` 是一个可扩展的管理后台模板仓库，当前默认实现为：

- 后端：Flask，目录 `backend-flask/`
- 前端：Next.js，目录 `frontend-next/`

仓库地址：

- https://github.com/xuxuejin/boss-admin

## 目录结构

```text
boss-admin/
├── backend-flask/
└── frontend-next/
```

## 前端开发

```bash
cd frontend-next
pnpm install
pnpm run dev
```

## 后端开发

```bash
cd backend-flask
uv sync --group dev
uv pip install -e .
uv run flask --app app:create_app --debug run --port 3001
```

## 说明

- 当前仓库采用 monorepo 方式管理前后端。
- 目录名带技术栈后缀，便于未来增加 `backend-fastapi`、`frontend-vue` 等实现。
- 后端更详细说明见 [`backend-flask/README.md`](backend-flask/README.md)。
