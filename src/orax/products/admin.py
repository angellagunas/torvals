"""Admin for products module."""
from django.contrib import admin
from orax.products.models import Product


admin.site.register(Product)
