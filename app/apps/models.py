from django.db import models


class AppType(models.Model):
    name = models.CharField(
        max_length=60,
        unique=True,
        help_text=(
            "There are 2 application types, the apps like "
            "Python, Java, Jenkins, etc. And the apps wich are developing in "
            "IB, like kidzania, Interjet, etc."
        )
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


class App(models.Model):
    name = models.CharField(
        max_length=100,
        blank=False,
        null=False,
        help_text="Java, Python, Jenkins, Intertours project, etc."
    )

    version = models.CharField(
        max_length=12,
        default="1",
        help_text=(
            "For example the python version is 3.6, the JDK version is 8, etc"
        )
    )

    source_URL = models.URLField(
        help_text="URL where the app can be download"
    )

    notes = models.TextField(
        help_text="Notes about how to install the app or some comment"
    )

    type = models.ForeignKey(
        AppType,
        related_name="apps",
        help_text="Application type, for example program or an IB project"
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


class Port(models.Model):
    number = models.PositiveIntegerField(
        unique=True,
        help_text="The port number, like: 8080, 80 ..."
    )

    app = models.ForeignKey(
        App,
        related_name="used_ports",
        help_text="App wich is using this port"
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
        return str(self.number)
