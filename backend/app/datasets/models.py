"""Define the dataset structure in DB."""
import csv
import os

from django.contrib.postgres.fields import JSONField
from django.db import models

import pandas as pd


from app.products.models import Product
from app.projects.models import Project
from app.sales_centers.models import SaleCenter
from app.settings import MEDIA_ROOT
from app.users.models import UserManager
from app.utils.models import CatalogueMixin, TimeStampedMixin


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

    is_main = models.BooleanField(
        default=True
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

    def _get_row_values_from_headers(self, row, stat_cols, dynamic_cols_name):
        full_row = []
        extra_data = row.extra_columns

        full_row.append(row.date)
        full_row.append(row.sale_center.external_id)
        full_row.append(row.product.external_id)

        for column in dynamic_cols_name:
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

    is_active = models.BooleanField(
        default=True,
        verbose_name='is active'
    )

    date = models.DateField()

    #
    # transit, in_stock, safety_stock, prediction, adjustment, bed, pallet
    #
    extra_columns = JSONField(null=True, blank=True)

    def __str__(self):
        """Return the representation in String of this model."""
        return self.product.name
