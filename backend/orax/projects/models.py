"""Define the project structure in DB."""
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

    def __str__(self):
        """Representation in string."""
        return self.name
