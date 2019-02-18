"""Admin for dataset module."""
from django.contrib import admin
from orax.datasets.models import Dataset


admin.site.register(Dataset)
