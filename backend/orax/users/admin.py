"""Admin for users module."""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from orax.users.models import User


class CustomUserAdmin(UserAdmin):
    """Admin for user."""

    pass


admin.site.register(User, CustomUserAdmin)
