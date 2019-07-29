"""Manage tasks of all projects."""
from celery import shared_task

from app.utils.plugins.utils import BarcelUtils, GloboUtils
from app.utils.plugins.extraction.dsd import DSDExtractor
from app.utils.tasks import send_slack_notifications


@shared_task
def run_globo_process():
    """Run process to calculate order of ElGlobo."""
    send_slack_notifications.apply_async(("ElGlobo process has started.",))
    try:
        GloboUtils().run()
    except Exception as e:
        send_slack_notifications.apply_async(
            ("ElGlobo process\nError: {}".format(e),)
        )
    send_slack_notifications.apply_async(("ElGlobo process has finished.",))


@shared_task
def send_order_to_dispatcher(dispatcher_email, receivers):
    """Send order to user without adjustment."""
    BarcelUtils().send_order_to_dispatcher(dispatcher_email, receivers)


@shared_task
def extract_bimbo_sales_for_one_day(xml_config, query, date, name):
    """Extact bimbo sales for one day only."""
    return DSDExtractor().extract(xml_config, query, date, name)
