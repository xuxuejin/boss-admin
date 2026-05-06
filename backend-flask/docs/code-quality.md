# 代码质量工具链

## 目标

- `ruff`
    - 负责 lint、import 排序、部分现代化建议
- `ruff format`
    - 负责统一代码格式
- `mypy`
    - 负责基础类型检查
- `pre-commit`
    - 负责在提交前自动执行校验

## 安装

开发环境推荐先安装 dev 工具依赖：

```bash
uv sync --group dev
```

如果你已经安装过普通依赖，也可以单独补齐：

```bash
uv pip install -e .
uv sync --group dev
```

## 日常命令

检查代码问题：

```bash
uv run ruff check .
```

自动修复部分问题：

```bash
uv run ruff check . --fix
```

格式化代码：

```bash
uv run ruff format .
```

运行类型检查：

```bash
uv run mypy app
```

## pre-commit

安装 git 提交钩子：

```bash
uv run pre-commit install
```

手动对全项目跑一遍：

```bash
uv run pre-commit run --all-files
```

## 配置说明

### Ruff

配置写在 [`pyproject.toml`](../pyproject.toml)：

- 行宽：`100`
- Python 目标版本：`3.12`
- 默认启用规则：
    - `E` / `F`
    - `I`
    - `B`
    - `UP`
    - `SIM`
    - `RET`
    - `ARG`
    - `RUF`

当前有意忽略：

- `E501`
    - 不强制按“单行超长”报错
    - 以格式化和实际可读性为主

### mypy

当前策略是“先温和启用”：

- 检查未标注函数体内部的问题
- 允许部分函数暂时不写完整类型注解
- 对第三方库缺少类型定义的情况做忽略处理

## 推荐使用习惯

日常开发：

```bash
uv run ruff check . --fix
uv run ruff format .
```

提交前：

```bash
uv run mypy app
uv run pre-commit run --all-files
```
