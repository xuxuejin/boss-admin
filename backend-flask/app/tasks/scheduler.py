import signal
import time

from apscheduler.schedulers.background import BackgroundScheduler

from app.tasks.crawl_task import crawl_mattress_job

scheduler = BackgroundScheduler(timezone='UTC')


def run_with_context(app, job_func):
    """
    保证 scheduler job 在 Flask app context 中执行。
    """
    with app.app_context():
        job_func()


def configure_scheduler(app):
    if scheduler.get_job('crawl_mattress'):
        return scheduler

    scheduler.add_job(
        func=lambda: run_with_context(app, crawl_mattress_job),
        trigger='interval',
        hours=6,
        id='crawl_mattress',
        replace_existing=True,
    )
    return scheduler


def run_scheduler(app):
    """
    启动独立 scheduler 进程。
    这个入口给 CLI/独立容器使用 不在 Web 进程中自动调用。
    """
    configure_scheduler(app)

    if not scheduler.running:
        scheduler.start()
        app.logger.info('APScheduler started.')

    run_with_context(app, crawl_mattress_job)

    should_stop = False

    def handle_shutdown(signum, frame):
        nonlocal should_stop
        should_stop = True

    signal.signal(signal.SIGINT, handle_shutdown)
    signal.signal(signal.SIGTERM, handle_shutdown)

    try:
        while not should_stop:
            time.sleep(1)
    finally:
        scheduler.shutdown(wait=False)
        app.logger.info('APScheduler stopped.')
