"""Define the dataset structure in DB."""
from django.db import models

from orax.utils.models import CatalogueMixin
from orax.organizations.models import Organization

BATCH_TYPE = [
    ('channel', 'channel'),
    ('products', 'products'),
    ('routes', 'routes'),
    ('sales_centers', 'sales_centers'),
]


class Batch(CatalogueMixin):
    """Save info about Batch."""

    class Meta:
        """Define the verbose names."""

        verbose_name = 'batch'
        verbose_name_plural = 'batch'

    file = models.FileField(upload_to="files")

    description = models.CharField(
        max_length=255,
        verbose_name='description'
    )

    type = models.CharField(
        max_length=255,
        verbose_name='type',
        choices=BATCH_TYPE
    )