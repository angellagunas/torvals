"""Admin for routes module."""
from django.contrib import admin
from orax.routes.models import Route


class RouteAdmin(admin.ModelAdmin):
    """Admin to manage routes."""
    model = Route
    list_display = ['name']


admin.site.register(Route, RouteAdmin)
