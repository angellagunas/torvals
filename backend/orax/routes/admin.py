"""Admin for routes module."""
from django.contrib import admin
from orax.routes.models import Route


class RouteAdmin(admin.ModelAdmin):
    """Admin to manage routes."""

    model = Route
    list_display = ['external_id', 'name']

    def get_queryset(self, request):
        """Overwrite queryset."""
        qs = super(RouteAdmin, self).get_queryset(request)
        return qs.filter(is_active=True)


admin.site.register(Route, RouteAdmin)
