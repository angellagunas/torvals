"""Define the product structure in DB."""
from django.db import models

from orax.utils.models import CatalogueMixin
from orax.organizations.models import Organization


class Product(CatalogueMixin):
    """Save info about Product."""

    class Meta:
        """Define the verbose names."""

        verbose_name = 'product'
        verbose_name_plural = 'products'

    organization = models.ForeignKey(Organization)

    price = models.DecimalField(
        max_digits=19,
        decimal_places=3,
        default=0
    )

    quota = models.IntegerField(
        default=1,
        help_text="Cantidad de productos para llenar un corrugado."
    )

    external_id = models.CharField(
        max_length=255,
        verbose_name='external id'
    )

    def __unicode__(self):
        """Return the representation in String of this model."""
        return self.name

    def __str__(self):
        """Return the representation in String of this model."""
        return self.name
