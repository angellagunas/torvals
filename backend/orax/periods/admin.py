"""Admin for organizations module."""
from django.contrib import admin
from orax.periods.models import Period


admin.site.register(Period)
