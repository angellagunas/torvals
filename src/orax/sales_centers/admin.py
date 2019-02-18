"""Admin for rules module."""
from django.contrib import admin
from orax.sales_centers.models import SaleCenter


admin.site.register(SaleCenter)
