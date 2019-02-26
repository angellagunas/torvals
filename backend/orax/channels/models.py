"""Define the channel structure in DB."""
from django.db import models

from orax.utils.models import CatalogueMixin
from orax.organizations.models import Organization


class Channel(CatalogueMixin):
    """Save info about Channel rows."""

    class Meta:
        """Define the verbose names."""

        verbose_name = 'channel'
        verbose_name_plural = 'channels'

    organization = models.ForeignKey(Organization)
    external_id = models.CharField(
        max_length=255,
        verbose_name='external id'
    )
