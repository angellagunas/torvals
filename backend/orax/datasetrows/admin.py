"""Admin for datasetrows module."""
from django.contrib import admin
from orax.datasetrows.models import DatasetRow


class DatasetRowsAdmin(admin.ModelAdmin):
    """Admin to manage rows."""

    model = DatasetRow
    list_display = [
        'get_product_name',
        'prediction',
        'adjustment',
        'refund',
        'sale'
    ]
    search_fields = ['product']

    def get_product_name(self, obj):
        """Return product name."""
        return obj.product.name

    def get_queryset(self, request):
        """Overwrite queryset."""
        qs = super(DatasetRowsAdmin, self).get_queryset(request)
        return qs.filter(is_active=True)


admin.site.register(DatasetRow, DatasetRowsAdmin)
