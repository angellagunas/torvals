"""Admin for sales center module."""
from django.contrib import admin

from app.sales_centers.models import SaleCenter


class SaleCenterAdmin(admin.ModelAdmin):
    """Admin to manage sales centers."""

    model = SaleCenter
    list_display = [
        'external_id',
        'name',
        'project'
    ]
    search_fields = ['external_id', 'name', 'project__name']

    def get_queryset(self, request):
        """Overwrite queryset."""
        qs = super(SaleCenterAdmin, self).get_queryset(request)
        return qs.filter(is_active=True)


admin.site.register(SaleCenter, SaleCenterAdmin)
