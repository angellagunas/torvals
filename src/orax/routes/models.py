"""Define the route structure in DB."""
from django.db import models

from orax.organizations.models import Organization
from orax.utils.models import CatalogueMixin


class Route(CatalogueMixin):
    """Save info about Route."""

    class Meta:
        """Define the verbose names."""

        verbose_name = 'route'
        verbose_name_plural = 'routes'

    organization = models.ForeignKey(Organization)
    external_id = models.CharField(
        max_length=255,
        verbose_name='external id'
    )
