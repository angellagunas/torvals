"""Manage tasks of all projects."""
from celery import shared_task

from app.utils.plugins.utils import GloboUtils
from app.utils.tasks import send_slack_notifications


@shared_task
def run_globo_process():
    """Run process to calculate order of ElGlobo."""
    send_slack_notifications.apply_async(("ElGlobo process has started.",))
    GloboUtils().run()
    send_slack_notifications.apply_async(("ElGlobo process has finished.",))
