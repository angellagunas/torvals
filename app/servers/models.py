from django.db import models


class Server(models.Model):
    name = models.CharField(
        max_length=60,
        blank=False,
        null=False,
        help_text="The key to identify the server. For example turing-server."
    )

    ip_v4 = models.CharField(
        max_length=15,
        blank=False,
        null=False,
        help_text="The IP V4 of server"
    )

    ip_v6 = models.CharField(
        max_length=60,
        blank=True,
        null=True,
        help_text="The IP V6 of server"
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


class Environment(models.Model):
    name = models.CharField(
        max_length=60,
        blank=False,
        null=False,
        help_text=(
            "A server can have one or more environments. "
            "For example: Testing, CI, Demo, Production, etc"
        )
    )

    server = models.ManyToManyField(
        Server,
        related_name="environments"
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
