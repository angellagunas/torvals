"""Celery tasks."""

from app.settings import SLACKBOT_TOKEN, NOTIFICATIONS_CHANNEL
from slacker import Slacker
from celery import shared_task


@shared_task
def send_slack_notifications(message):
    """Function that post a message to the channel of choice."""
    slack = Slacker(SLACKBOT_TOKEN)
    channel = NOTIFICATIONS_CHANNEL
    message = (
        '*:bellhop_bell:  Torvals notifications:*\n>{0}'
    ).format(
        message
    )
    return slack.chat.post_message(channel, message)
