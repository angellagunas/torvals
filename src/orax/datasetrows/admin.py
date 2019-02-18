"""Admin for datasetrows module."""
from django.contrib import admin
from orax.datasetrows.models import DatasetRow


admin.site.register(DatasetRow)
