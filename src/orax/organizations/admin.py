"""Admin for organizations module."""
from django.contrib import admin
from orax.organizations.models import Organization


admin.site.register(Organization)
