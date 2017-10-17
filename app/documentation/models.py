from django.contrib.auth import get_user_model
from django.db import models

User = get_user_model()


class DocumentationType(models.Model):
    name = models.CharField(
        max_length=100,
        blank=False,
        null=False,
        help_text=(
            "The document type could be "
            "Installation guide, Error Documentation, etc."
        )
    )

    class Meta:
        verbose_name = "Document type"
        verbose_name_plural = "Document types"

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


class Documentation(models.Model):
    title = models.CharField(
        max_length=200,
        blank=False,
        null=False,
        help_text=(
            "The document title. For example: "
            "'Jenkins installation on ubuntu 16.04' "
            "or a common error like 'CSRF token missing or incorrect.'"
        )
    )

    body = models.TextField(
        help_text=(
            "Is the content of the guide or how to fix a common error. "
            "The text should be formatted in markdown"
        )
    )

    type = models.ForeignKey(
        DocumentationType,
        related_name="documents"
    )

    author = models.ForeignKey(
        User,
        related_name="documents"
    )

    class Meta:
        verbose_name = "Document"
        verbose_name_plural = "Documents"

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
        return self.title


class Answer(models.Model):
    body = models.TextField(
        help_text=(
            "A installation guide could has a extra notes or an "
            "common error could has one or more ways to fix it. "
            "The text should be formatted in markdown"
        )
    )

    author = models.ForeignKey(
        User,
        related_name="answers"
    )

    class Meta:
        verbose_name = "Answer"
        verbose_name_plural = "Answers"

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
        return self.author
