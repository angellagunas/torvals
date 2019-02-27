"""Define the dataset structure in DB."""
from django.db import models

from orax.utils.models import CatalogueMixin
from orax.rules.models import Rule
from orax.organizations.models import Organization
from orax.users.models import UserManager

DATASET_STATUS = [
    ('new', 'new'),
    ('uploading', 'uploading'),
    ('uploaded', 'uploaded'),
    ('preprocessing', 'preprocessing'),
    ('configuring', 'configuring'),
    ('processing', 'processing'),
    ('reviewing', 'reviewing'),
    ('ready', 'ready'),
    ('conciliating', 'conciliating'),
    ('conciliated', 'conciliated'),
    ('pendingRows', 'pendingRows'),
    ('adjustment', 'adjustment'),
    ('receiving', 'receiving'),
    ('cloning', 'cloning'),
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

    max_date = models.DateField(
        null=True,
        blank=True,
        verbose_name='max date'
    )

    min_date = models.DateField(
        null=True,
        blank=True,
        verbose_name='min date'
    )

    is_main = models.BooleanField(
        default=False
    )

    status = models.CharField(
        max_length=255,
        verbose_name='status',
        choices=DATASET_STATUS
    )

    rule = models.ForeignKey(
        Rule,
        null=True,
        blank=True
    )

    date_adjustment = models.DateField(
        help_text="Fecha en la cual se va a ajustar el forecast."
    )

    organization = models.ForeignKey(Organization)
    project = models.ForeignKey(
        'projects.Project',
        related_name='datasets',
        null=True,
        blank=True
    )

    objects = UserManager()
