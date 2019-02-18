"""Admin for cycles module."""
from django.contrib import admin
from orax.cycles.models import Cycle


admin.site.register(Cycle)
