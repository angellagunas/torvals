"""Admin for rules module."""
from django.contrib import admin
from orax.rules.models import Rule


admin.site.register(Rule)
