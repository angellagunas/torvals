"""Define the rule structure in DB."""
from django.db import models

from orax.utils.models import TimeStampedMixin
from orax.organizations.models import Organization


class Rule(TimeStampedMixin):
    """Save info about Rule."""

    class Meta:
        """Define the verbose names."""

        verbose_name = 'rule'
        verbose_name_plural = 'rules'

    start_date = models.DateTimeField()
    cycle_duration = models.PositiveIntegerField()
    cycle = models.CharField(
        max_length=25,
        verbose_name='cycle'
    )
    period_duration = models.PositiveIntegerField()
    period = models.CharField(
        max_length=25,
        verbose_name='period'
    )
    season = models.PositiveIntegerField()
    available_cycles = models.PositiveIntegerField()
    take_start = models.BooleanField(
        default=True
    )
    consolidation = models.PositiveIntegerField()
    organization = models.ForeignKey(Organization)
    is_current = models.BooleanField(
        default=True
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='is active'
    )
