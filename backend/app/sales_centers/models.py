"""Define the sale center structure in DB."""
from django.db import models

from app.projects.models import Project
from app.utils.models import CatalogueMixin


class SaleCenter(CatalogueMixin):
    """Save info about Sale center."""

    class Meta:
        """Define the verbose names."""

        verbose_name = 'sale center'
        verbose_name_plural = 'sales centers'

    external_id = models.CharField(
        max_length=255,
        verbose_name='external id'
    )

    project = models.ForeignKey(
        Project,
        null=True
    )

    def __str__(self):
        """Return the representation in String of this model."""
        return '{0}-{1}'.format(self.external_id, self.name)
