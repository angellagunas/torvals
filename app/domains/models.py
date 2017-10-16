from app.providers.models import Provider
from app.servers.models import Server

from django.db import models


class Domain(models.Model):
    name = models.CharField(
        max_length=60,
        blank=False,
        null=False,
        help_text="Domain name, for example goole.com"
    )

    server = models.ForeignKey(
        Server,
        related_name="domains",
        help_text="Server where the domain is pointing"
    )

    provider = models.ForeignKey(
        Provider,
        related_name="providers",
        help_text="Provider who sold the domain. For example Azure, Google.."
    )

    class Meta:
        drf_config = {
            'api': {
                'scaffolding': True
            },
            'serializer': {
                'scaffolding': True
            },
            'form': {
                'scaffolding': True
            },
            'admin': {
                'scaffolding': True
            }
        }

    def __str__(self):
        return self.name
