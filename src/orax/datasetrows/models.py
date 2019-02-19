"""Define the dataset rows structure in DB."""
from django.db import models

from orax.utils.models import TimeStampedMixin
from orax.channels.models import Channel
from orax.cycles.models import Cycle
from orax.datasets.models import Dataset
from orax.organizations.models import Organization
from orax.periods.models import Period
from orax.projects.models import Project
from orax.products.models import Product
from orax.sales_centers.models import SaleCenter

DATASETROW_STATUS = [
    ('created', 'created'),
    ('processing', 'processing'),
    ('done', 'done'),
    ('unmodified', 'unmodified'),
    ('sendingChanges', 'sendingChanges'),
    ('adjusted', 'adjusted'),
    ('error', 'error')
]


class DatasetRow(TimeStampedMixin):
    """Save info about Dataset rows."""

    class Meta:
        """Define the verbose names."""

        verbose_name = 'dataset row'
        verbose_name_plural = 'dataset rows'

    prediction = models.PositiveIntegerField()
    adjustment = models.PositiveIntegerField()

    organization = models.ForeignKey(Organization)
    project = models.ForeignKey(Project)
    dataset = models.ForeignKey(Dataset)
    product = models.ForeignKey(Product)
    channel = models.ForeignKey(Channel)
    sale_center = models.ForeignKey(SaleCenter)
    cycle = models.ForeignKey(Cycle)
    period = models.ForeignKey(Period)
    status = models.CharField(
        max_length=255,
        verbose_name='status',
        choices=DATASETROW_STATUS
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='is active'
    )

    def __unicode__(self):
        """Return the representation in String of this model."""
        return self.adjustment
