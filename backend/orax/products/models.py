"""Define the product structure in DB."""
from django.db import models

from orax.projects.models import Project
from orax.utils.models import CatalogueMixin


class Product(CatalogueMixin):
    """Save info about Product."""

    class Meta:
        """Define the verbose names."""

        verbose_name = 'product'
        verbose_name_plural = 'products'

    price = models.DecimalField(
        max_digits=19,
        decimal_places=3,
        default=0
    )

    quota = models.IntegerField(
        default=1,
        help_text="Cantidad de productos para llenar un corrugado."
    )

    bed = models.IntegerField(
        default=1,
        help_text="Cantidad de corrugados para llenar una cama."
    )

    pallet = models.IntegerField(
        default=1,
        help_text="Cantidad de corrugados para llenar una tarima."
    )

    external_id = models.CharField(
        max_length=255,
        verbose_name='external id'
    )

    project = models.ForeignKey(
        Project,
        null=True
    )

    def __unicode__(self):
        """Return the representation in String of this model."""
        return self.name

    def __str__(self):
        """Return the representation in String of this model."""
        return '{0}-{1}'.format(self.external_id, self.name)
