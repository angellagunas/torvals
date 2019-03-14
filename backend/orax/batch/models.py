"""Define the dataset structure in DB."""
from django.db import models

from orax.utils.models import CatalogueMixin

BATCH_TYPE = [
    ('products', 'products'),
    ('sales_centers', 'sales_centers')
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

    separated_by = models.CharField(
        max_length=1,
        verbose_name='separated_by',
        default=','
    )
