"""Define the dataset structure in DB."""
from django.db import models

from orax.utils.models import CatalogueMixin
from orax.users.models import UserManager

DATASET_STATUS = [
    ('new', 'new'),
    ('error', 'error')
]


class Dataset(CatalogueMixin):
    """Save info about Dataset."""

    class Meta:
        """Define the verbose names."""

        verbose_name = 'dataset'
        verbose_name_plural = 'datasets'

    file = models.FileField(upload_to="files")

    description = models.CharField(
        max_length=255,
        verbose_name='description'
    )

    error_msg = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        verbose_name='error message'
    )

    is_main = models.BooleanField(
        default=False
    )

    status = models.CharField(
        max_length=255,
        verbose_name='status',
        choices=DATASET_STATUS,
        default='new'
    )

    date_adjustment = models.DateField(
        help_text="Fecha en la cual se va a ajustar el forecast."
    )

    objects = UserManager()
