"""Define the dataset structure in DB."""
from django.db import models

from orax.products.models import Product
from orax.projects.models import Project
from orax.sales_centers.models import SaleCenter
from orax.users.models import UserManager
from orax.utils.models import CatalogueMixin, TimeStampedMixin

DATASET_STATUS = [
    ('new', 'new'),
    ('error', 'error')
]

DATASETROW_STATUS = [
    ('done', 'done'),
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
        default=True
    )

    status = models.CharField(
        max_length=255,
        verbose_name='status',
        choices=DATASET_STATUS,
        default='new'
    )

    date_adjustment = models.DateField(
        null=False,
        blank=False,
        help_text="Fecha en la cual se va a ajustar el forecast."
    )

    project = models.ForeignKey(Project)

    objects = UserManager()


class DatasetRow(TimeStampedMixin):
    """Save info about Dataset rows."""

    class Meta:
        """Define the verbose names."""

        verbose_name = 'dataset row'
        verbose_name_plural = 'dataset rows'

    dataset = models.ForeignKey(
        Dataset
    )
    product = models.ForeignKey(
        Product
    )
    sale_center = models.ForeignKey(
        SaleCenter
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
    date = models.DateField()

    #
    # products in trucks
    #
    transit = models.PositiveIntegerField()
    #
    # products in stock.
    #
    in_stock = models.PositiveIntegerField()
    #
    # minimun products in stock.
    #
    safety_stock = models.PositiveIntegerField()
    #
    # the suggested order.
    #
    prediction = models.PositiveIntegerField()
    #
    # prediction adjusted.
    #
    adjustment = models.PositiveIntegerField()
    #
    # how many beds should order the user.
    #
    bed = models.PositiveIntegerField()
    #
    # how many pallets should order the user.
    #
    pallet = models.PositiveIntegerField()

    def __unicode__(self):
        """Return the representation in String of this model."""
        return self.adjustment
