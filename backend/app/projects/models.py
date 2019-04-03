"""Define the project structure in DB."""
from django.contrib.postgres.fields import ArrayField
from django.db import models

from app.utils.models import CatalogueMixin


class Project(CatalogueMixin):
    """Save info about Project."""

    class Meta:
        """Define the verbose names."""

        verbose_name = 'project'
        verbose_name_plural = 'projects'

    description = models.CharField(
        max_length=255,
        verbose_name='description'
    )

    can_adjust = models.BooleanField(
        default=True,
        help_text="Define si se puede ajustar la prediccion en el proyecto."
    )

    can_dowload_report = models.BooleanField(
        default=True,
        help_text="Define si el usuario final puede descargar el reporte."
    )

    can_send_report = models.BooleanField(
        default=True,
        help_text=(
            "Define si el usuario final puede enviar el reporte por email "
            "a su superior."
        )
    )

    #
    # columns mapping fields.
    #
    date = models.CharField(
        max_length=255,
        verbose_name='Fecha',
        blank=True,
        null=True
    )

    ceve_id = models.CharField(
        max_length=255,
        verbose_name='Centro de venta ID',
        blank=True,
        null=True
    )

    product_id = models.CharField(
        max_length=255,
        verbose_name='Producto ID',
        blank=True,
        null=True
    )

    dynamic_columns_name = ArrayField(
        models.CharField(
            max_length=200
        ),
        null=True,
        blank=True
    )

    def __str__(self):
        """Representation in string."""
        return self.name

    def get_map_columns_name(self):
        columns = [
            self.date,
            self.ceve_id,
            self.product_id
        ]
        return [c for c in columns if c]

    def get_columns_name(self):
        columns = [
            'date',
            'sale_center_id',
            'product'
        ]

        return columns
