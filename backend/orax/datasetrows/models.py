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
from orax.routes.models import Route
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
    sale = models.IntegerField(
        default=0
    )
    refund = models.IntegerField(
        default=0
    )
    date = models.DateField()

    organization = models.ForeignKey(
        Organization
    )
    project = models.ForeignKey(
        Project
    )
    dataset = models.ForeignKey(
        Dataset
    )
    product = models.ForeignKey(
        Product
    )
    sale_center = models.ForeignKey(
        SaleCenter
    )
    route = models.ForeignKey(
        Route,
        null=True
    )

    channel = models.ForeignKey(
        Channel,
        null=True
    )
    cycle = models.ForeignKey(
        Cycle,
        null=True
    )
    period = models.ForeignKey(
        Period,
        null=True
    )
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