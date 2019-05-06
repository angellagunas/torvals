"""Admin for sales center module."""
from django.contrib import admin

from app.datasets.models import DatasetRow
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
    actions = ["disable_rows"]

    def disable_rows(self, request, queryset):
        """Disable rows which belongs to given sale center."""
        rows = DatasetRow.objects.filter(
            sale_center__in=queryset,
            is_active=True
        ).update(
            is_active=False
        )

        self.message_user(request, 'Se actualizaron {0} rows'.format(rows))

    disable_rows.short_description = "Disable rows"

    def get_queryset(self, request):
        """Overwrite queryset."""
        qs = super(SaleCenterAdmin, self).get_queryset(request)
        return qs.filter(is_active=True)


admin.site.register(SaleCenter, SaleCenterAdmin)
