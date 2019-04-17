"""Define the dataset structure in DB."""
import csv
import os

import boto3

from django.contrib.postgres.fields import JSONField
from django.db import models
from django.utils.text import slugify

from app.datasets.utils import load_dataset
from app.products.models import Product
from app.projects.models import Project
from app.sales_centers.models import SaleCenter
from app.settings import AWS_ACCESS_ID, AWS_ACCESS_KEY, MEDIA_ROOT
from app.users.models import UserManager
from app.utils import get_csv_columns
from app.utils.models import CatalogueMixin, TimeStampedMixin


class Dataset(CatalogueMixin):
    """Save info about Dataset."""

    class Meta:
        """Define the verbose names."""

        verbose_name = 'dataset'
        verbose_name_plural = 'datasets'

    file = models.FileField(
        upload_to="files",
        null=True
    )

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
        """Export rows to csv."""
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
        """Representaction in string."""
        return "{0}-{1}".format(self.name, self.project)

    def get_extra_columns(self, _path=None):
        """Return columns names."""
        static_columns = self.project.get_map_columns_name()

        path = _path if _path else self.file.name
        path = os.path.join(MEDIA_ROOT, path)

        all_columns = get_csv_columns(path)

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

    def append_rows_from_s3(self, aws_file_name, aws_dir, aws_bucket_name):
        """Load rows from s3."""
        dataset_id = self.id

        s3 = boto3.resource(
            's3',
            aws_access_key_id=AWS_ACCESS_ID,
            aws_secret_access_key=AWS_ACCESS_KEY
        )

        s3_path = '{0}/{1}'.format(aws_dir, aws_file_name)
        target_path = '{0}/files/{1}'.format(MEDIA_ROOT,
                                             slugify(aws_file_name))

        s3.Bucket(aws_bucket_name).download_file(s3_path, target_path)

        file_s3 = open(target_path)
        return load_dataset(self, _file=file_s3, dataset_id=dataset_id)


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

    is_extraordinary = models.BooleanField(
        default=False,
        verbose_name='is extraordinary'
    )

    def __str__(self):
        """Return the representation in String of this model."""
        return self.product.name
