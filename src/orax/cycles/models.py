"""Define the cycle structure in DB."""
from django.db import models

from orax.utils.models import TimeStampedMixin
from orax.organizations.models import Organization
from orax.rules.models import Rule


class Cycle(TimeStampedMixin):
    """Save info about cycle."""

    class Meta:
        """Define the verbose names."""

        verbose_name = 'cycle'
        verbose_name_plural = 'cycles'

    organization = models.ForeignKey(Organization)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    cycle = models.PositiveIntegerField()
    rule = models.ForeignKey(
        Rule,
        null=True,
        blank=True,
        related_name='cycles'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='is active'
    )

    def __unicode__(self):
        """Return the representation in String of this model."""
        return self.cycle
