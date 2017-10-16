from django.db import models


class Provider(models.Model):
    name = models.CharField(
        max_length=100,
        blank=False,
        null=False,
        help_text="Name of provider. For example Google, Azure ..."
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
