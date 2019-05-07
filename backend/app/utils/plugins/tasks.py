"""Manage tasks of all projects."""
from celery import shared_task

from app.utils.plugins.utils import GloboUtils
from app.utils.tasks import send_slack_notifications


@shared_task
def run_globo_process():
    """Run process to calculate order of ElGlobo."""
    send_slack_notifications.apply_async(("ElGlobo process has started.",))
    try:
        GloboUtils().run()
    except Exception as e:
        send_slack_notifications.apply_async(("ElGlobo process\nError: {}".format(e),))
    send_slack_notifications.apply_async(("ElGlobo process has finished.",))
