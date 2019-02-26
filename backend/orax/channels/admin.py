"""Admin for channels module."""
from django.contrib import admin
from orax.channels.models import Channel


admin.site.register(Channel)
