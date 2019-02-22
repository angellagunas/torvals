"""Admin for routes module."""
from django.contrib import admin
from orax.routes.models import Route


admin.site.register(Route)
