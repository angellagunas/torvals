"""Define the dataset structure in DB."""
import csv
import os
import pandas as pd

from django.contrib.postgres.fields import JSONField
from django.db import models

from orax.products.models import Product
from orax.projects.models import Project
from orax.sales_centers.models import SaleCenter
from orax.users.models import UserManager
from orax.utils.models import CatalogueMixin, TimeStampedMixin
from orax.settings import MEDIA_ROOT

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

    def to_web_csv(self, response, filters={}):
        extra_columns = self.project.dynamic_columns_name

        headers = self.project.get_map_columns_name() + extra_columns

        writer = csv.writer(response)
        writer.writerow(headers)

        filters['dataset_id'] = self.id
        rows = DatasetRow.objects.filter(**filters)

        for row in rows:
            row = writer.writerow(
                self._get_row_values_from_headers(
                    row,
                    self.project.get_columns_name(),
                    extra_columns
                )
            )

        return writer

    def __str__(self):
        return "{0}-{1}".format(self.name, self.project)

    def get_extra_columns(self):
        static_columns = self.project.get_map_columns_name()
        path = os.path.join(MEDIA_ROOT, self.file.name)
        csv_file = pd.read_csv(path)
        all_columns = list(csv_file.columns)
        extra = list(set(all_columns) - set(static_columns))
        return extra

    def _get_row_values_from_headers(self, row, static_columns, dynamic_columns_name):
        full_row = []
        extra_data = row.extra_columns

        full_row.append(row.date)
        full_row.append(row.sale_center.external_id)
        full_row.append(row.product.external_id)

        if self.project.transits:
            full_row.append(row.transit)

        full_row.append(row.in_stock)
        full_row.append(row.safety_stock)
        full_row.append(row.prediction)
        full_row.append(row.adjustment)

        if self.project.beds:
            full_row.append(row.bed)

        if self.project.pallets:
            full_row.append(row.pallet)

        for column in dynamic_columns_name:
            full_row.append(extra_data.get(column, 0))

        return full_row


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

    #
    # store aditional columns
    #
    extra_columns = JSONField(null=True, blank=True)

    def __str__(self):
        """Return the representation in String of this model."""
        return self.adjustment
