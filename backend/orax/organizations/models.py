"""Define the organization structure in DB."""
from django.db import models

from orax.utils.models import CatalogueMixin

ORG_STATUS = [
    ('active', 'active'),
    ('inactive', 'inactive'),
    ('trial', 'trial'),
    ('activationPending', 'activationPending')
]


class Organization(CatalogueMixin):
    """Save info about organization."""

    class Meta:
        """Define the verbose names."""

        verbose_name = 'organization'
        verbose_name_plural = 'organizations'

    description = models.CharField(
        max_length=255,
        verbose_name='description'
    )

    slug = models.CharField(
        max_length=255,
        verbose_name='slug'
    )

    picture = models.ImageField()

    country = models.CharField(
        max_length=255,
        verbose_name='country'
    )

    status = models.CharField(
        max_length=255,
        verbose_name='status',
        choices=ORG_STATUS,
        default='active'
    )
