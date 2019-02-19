"""Define the period structure in DB."""
from django.db import models

from orax.utils.models import TimeStampedMixin
from orax.cycles.models import Cycle
from orax.organizations.models import Organization
from orax.rules.models import Rule


class Period(TimeStampedMixin):
    """Save info about period."""

    class Meta:
        """Define the verbose names."""

        verbose_name = 'period'
        verbose_name_plural = 'periods'

    organization = models.ForeignKey(Organization)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    rule = models.ForeignKey(
        Rule,
        related_name='periods'
    )
    cycle = models.ForeignKey(Cycle)
    period = models.PositiveIntegerField()
    is_active = models.BooleanField(
        default=True,
        verbose_name='is active'
    )

    def __unicode__(self):
        """Return the representation in String of this model."""
        return self.period
