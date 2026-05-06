# 测试与覆盖率

## 推荐准备方式

为了避免本地测试时出现 `ModuleNotFoundError: No module named 'app'` 这类导入路径问题，推荐先把当前项目安装到虚拟环境中，再运行测试：

```bash
uv pip install -e .
```

推荐执行测试时优先使用：

```bash
python -m pytest
```

或者：

```bash
uv run pytest
```

## 测试分层

当前项目的测试分为三层：

1. 单元测试 `tests/unit/`
    - 测工具函数、小型逻辑、纯函数
    - 例如：`validate_phone`、`parse_expire_time`、`datetime_to_ts_ms`

2. 接口测试 `tests/integration/`
    - 通过 Flask `test_client()` 测完整请求链路
    - 例如：登录、获取当前用户、获取部门列表、创建部门

3. ORM / 事务测试 `tests/orm/`
    - 测数据库模型、事务提交和回滚、唯一约束等
    - 例如：`session_scope()`、`Department` 唯一约束

## 常用测试命令

运行全部测试：

```bash
python -m pytest
```

运行某个目录：

```bash
python -m pytest tests/unit
python -m pytest tests/integration
python -m pytest tests/orm
```

按 marker 运行某一层测试：

```bash
python -m pytest -m unit
python -m pytest -m integration
python -m pytest -m orm
```

排除某一层测试：

```bash
python -m pytest -m "not integration"
python -m pytest -m "not orm"
```

运行某个测试文件：

```bash
python -m pytest tests/integration/test_auth_api.py
```

运行某个测试方法：

```bash
python -m pytest tests/integration/test_auth_api.py::test_login_success_sets_cookie
```

按关键字筛选测试：

```bash
python -m pytest -k login
python -m pytest -k department
```

查看详细输出：

```bash
python -m pytest -v
```

遇到失败后立即停止：

```bash
python -m pytest -x
```

## 覆盖率

运行覆盖率并在终端显示未覆盖行：

```bash
python -m pytest --cov=app --cov-report=term-missing
```

生成 HTML 覆盖率报告：

```bash
python -m pytest --cov=app --cov-report=html
```

生成后可查看：

```text
htmlcov/index.html
```

## 推荐执行顺序

如果你现在是边开发边补测试，推荐这样做：

1. 先跑单元测试

```bash
python -m pytest tests/unit -v
```

2. 再跑接口测试

```bash
python -m pytest tests/integration -v
```

3. 再跑 ORM / 事务测试

```bash
python -m pytest tests/orm -v
```

4. 最后统一跑全部测试和覆盖率

```bash
python -m pytest --cov=app --cov-report=term-missing
```

## 最佳实践

- 日常开发：

```bash
python -m pytest tests/unit/test_parse_time.py
python -m pytest tests/integration/test_auth_api.py
python -m pytest -k login
python -m pytest -m unit
python -m pytest -m "integration and not orm"
```

- 提交前 / 阶段性检查：

```bash
python -m pytest
python -m pytest --cov=app --cov-report=term-missing
```
