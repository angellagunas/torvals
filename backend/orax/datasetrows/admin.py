"""Admin for datasetrows module."""
from django.contrib import admin
from orax.datasetrows.models import DatasetRow
from orax.datasets.models import Dataset


class DatasetRowsAdmin(admin.ModelAdmin):
    """Admin to manage rows."""

    model = DatasetRow
    list_display = [
        'get_product_name',
        'sale_center',
        'route',
        'prediction',
        'adjustment',
        'refund',
        'sale',
        'date'
    ]
    search_fields = ['product']

    def get_product_name(self, obj):
        """Return product name."""
        return obj.product.name

    def get_queryset(self, request):
        """Overwrite queryset."""
        qs = super(DatasetRowsAdmin, self).get_queryset(request)
        ds = Dataset.objects.get(is_main=True)
        return qs.filter(is_active=True, dataset=ds)


admin.site.register(DatasetRow, DatasetRowsAdmin)
