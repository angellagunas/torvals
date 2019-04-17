"""Admin for products module."""
from django.contrib import admin

from app.products.models import Product


class ProductAdmin(admin.ModelAdmin):
    """Admin to manage products."""

    model = Product
    list_display = [
        'name',
        'external_id',
        'price',
        'quota',
        'bed',
        'pallet',
        'project',
        'type'
    ]
    search_fields = ['name', 'external_id', 'type', 'project__name']

    def get_queryset(self, request):
        """Overwrite queryset."""
        qs = super(ProductAdmin, self).get_queryset(request)
        return qs.filter(is_active=True)


admin.site.register(Product, ProductAdmin)
