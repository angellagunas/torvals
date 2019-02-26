"""Admin for products module."""
from django.contrib import admin
from orax.projects.models import Project


admin.site.register(Project)
