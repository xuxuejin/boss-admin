import click
from flask import current_app
from flask.cli import with_appcontext
from sqlalchemy import select

from app.extensions import db, redis_client
from app.models.user import User
from app.utils.db import session_scope


# 切换到 backend-flask 根目录执行 flask init-db 就能初始化表
@click.command('init-db')
@with_appcontext
def init_db_command():
    """
    初始化数据库 创建所有表 并初始化一个超级管理员。
    """
    # 在应用上下文中执行数据库操作
    db.create_all()

    admin_user = db.session.execute(
        select(User).where(User.is_admin.is_(True))
    ).scalar_one_or_none()

    # 检查是否已有用户 如果没有 则创建超级管理员
    if admin_user is None:
        admin_user = User(username='boss', is_admin=True, phone_number='17600000000')
        admin_user.set_password('boss')  # 设置密码并哈希
        with session_scope() as session:
            session.add(admin_user)

        click.echo('Initial admin user created successfully.')
    else:
        click.echo('Admin user already exists.')

    click.echo('Database tables created successfully.')


@click.command('test-cmd')
@click.option('--name', default='World', help='Who to greet')
@with_appcontext
def test_command(name):
    """这是一个测试命令"""
    print(f'Hello, {name}! Flask app is running and command is working.')

    try:
        # 测试 redis
        redis_client.ping()
        print('Redis is connected!')

        # 也可以顺便测试一下读写
        redis_client.set('test_key', 'success', ex=10)
        print(f'Redis write/read test: {redis_client.get("test_key")}')
    except Exception as e:
        print(f'Redis not available: {e}')


@click.command('crawl-mattress')
@with_appcontext
def crawl_mattress_command():
    """执行一次床垫 Best Sellers 抓取任务。"""
    from app.tasks.crawl_task import crawl_mattress_job

    crawl_mattress_job()
    click.echo('Mattress crawl task finished.')


@click.command('run-scheduler')
@with_appcontext
def run_scheduler_command():
    """启动独立的 APScheduler 进程。"""
    from app.tasks.scheduler import run_scheduler

    run_scheduler(current_app._get_current_object())
