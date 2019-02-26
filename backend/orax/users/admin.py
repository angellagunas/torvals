"""Admin for users module."""
from django.contrib import admin
from orax.users.models import User


admin.site.register(User)
