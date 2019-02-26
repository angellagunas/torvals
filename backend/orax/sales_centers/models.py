"""Define the sale center structure in DB."""
from django.db import models

from orax.utils.models import CatalogueMixin
from orax.organizations.models import Organization


class SaleCenter(CatalogueMixin):
    """Save info about Sale center."""

    class Meta:
        """Define the verbose names."""

        verbose_name = 'sale center'
        verbose_name_plural = 'sales centers'

    organization = models.ForeignKey(Organization)
    external_id = models.CharField(
        max_length=255,
        verbose_name='external id'
    )
