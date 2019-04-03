"""Admin for products module."""
from django.contrib import admin

from app.projects.models import Project


admin.site.register(Project)
