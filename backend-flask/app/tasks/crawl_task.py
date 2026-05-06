from flask import current_app
from scripts.run_spider import scrape_mattress_best_sellers


def crawl_mattress_job():
    """
    APScheduler定时执行的任务
    """
    with current_app.app_context():
        scrape_mattress_best_sellers()
