"""Define the project structure in DB."""
from django.contrib.postgres.fields import ArrayField
from django.db import models

from orax.utils.models import CatalogueMixin


PROJECT_STATUS = [
    ('error', 'error'),
    ('ready', 'ready'),
]


class Project(CatalogueMixin):
    """Save info about Project."""

    class Meta:
        """Define the verbose names."""

        verbose_name = 'project'
        verbose_name_plural = 'projects'

    active_dataset = models.ForeignKey(
        'datasets.Dataset',
        null=True,
        blank=True,
        related_name='active_datasets'
    )

    status = models.CharField(
        max_length=255,
        verbose_name='status',
        default='ready',
        choices=PROJECT_STATUS
    )

    description = models.CharField(
        max_length=255,
        verbose_name='description'
    )

    admin_emails = ArrayField(
        models.CharField(
            max_length=200
        ),
        blank=True,
        null=True
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

    transits = models.CharField(
        max_length=255,
        verbose_name='Transitos',
        blank=True,
        null=True
    )

    in_stock = models.CharField(
        max_length=255,
        verbose_name='Inventario',
        blank=True,
        null=True
    )

    safety_stock = models.CharField(
        max_length=255,
        verbose_name='Safety stock',
        blank=True,
        null=True
    )

    prediction = models.CharField(
        max_length=255,
        verbose_name='Predicción',
        blank=True,
        null=True
    )

    adjustment = models.CharField(
        max_length=255,
        verbose_name='Predicción ajustada',
        blank=True,
        null=True
    )

    beds = models.CharField(
        max_length=255,
        verbose_name='Pedido en camas',
        blank=True,
        null=True
    )

    pallets = models.CharField(
        max_length=255,
        verbose_name='Pedido en tarimas',
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
            self.product_id,
            self.transits,
            self.in_stock,
            self.safety_stock,
            self.prediction,
            self.adjustment,
            self.beds,
            self.pallets
        ]
        return [c for c in columns if c]

    def get_columns_name(self):
        columns = [
            'date',
            'sale_center_id',
            'product',
            'transit',
            'in_stock',
            'safety_stock',
            'prediction',
            'adjustment',
            'bed',
            'pallet'
        ]

        return columns
