from app.datasets.models import Dataset
from app.utils.tasks import send_slack_notifications
from celery import shared_task


@shared_task
def set_schedulled_main_dataset(dataset_id, is_main=True):
    """ Task that set a dataset as main in periodic intervals. """
    message = (
        'Torvals notifications: The dataset, with id: {0}, was set as main.'
    ).format(
        dataset_id
    )
    try:
        dataset = Dataset.objects.get(id=dataset_id)
        dataset.is_main = is_main
        dataset.save()
    except Exception as e:
        message = (
            "An error was encountered, "
            "trying to set the given dataset as main. Datasetid: {0}"
        ).format(
            dataset_id
        )
    send_slack_notifications.apply_async((message,))
