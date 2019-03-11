"""Define the project structure in DB."""
from django.db import models

from orax.utils.models import CatalogueMixin
from orax.organizations.models import Organization
from orax.rules.models import Rule


PROJECT_STATUS = [
    ('empty', 'empty'),
    ('processing', 'processing'),
    ('ready', 'ready'),
    ('reviewing', 'reviewing'),
    ('pendingRows', 'pendingRows'),
    ('adjustment', 'adjustment'),
    ('conciliating', 'conciliating'),
    ('conciliatingForecast', 'conciliatingForecast'),
    ('cloning', 'cloning'),
    ('updating-rules', 'updating-rules'),
    ('pending-configuration', 'pending-configuration')
]

PROJECT_CYCLE_STATUS = [
    ('empty', 'empty'),
    ('consolidation', 'consolidation'),
    ('forecastCreation', 'forecastCreation'),
    ('rangeAdjustmentRequest', 'rangeAdjustmentRequest'),
    ('rangeAdjustment', 'rangeAdjustment'),
    ('salesUpload', 'salesUpload')
]


class Project(CatalogueMixin):
    """Save info about Project."""

    class Meta:
        """Define the verbose names."""

        verbose_name = 'project'
        verbose_name_plural = 'projects'

    organization = models.ForeignKey(Organization)
    main_dataset = models.ForeignKey(
        'datasets.Dataset',
        null=True,
        blank=True,
        related_name='main_datasets'
    )
    active_dataset = models.ForeignKey(
        'datasets.Dataset',
        null=True,
        blank=True,
        related_name='active_datasets'
    )
    status = models.CharField(
        max_length=255,
        verbose_name='status',
        choices=PROJECT_STATUS
    )
    cycle_status = models.CharField(
        max_length=255,
        verbose_name='cycle status',
        choices=PROJECT_CYCLE_STATUS
    )
    description = models.CharField(
        max_length=255,
        verbose_name='description'
    )
    rule = models.ForeignKey(
        Rule,
        null=True,
        blank=True
    )
