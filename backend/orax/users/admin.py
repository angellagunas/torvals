"""Admin for users module."""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import (
    AdminPasswordChangeForm, UserChangeForm, UserCreationForm,
)
from orax.users.models import User


class CustomUserAdmin(UserAdmin):
    """Admin for user."""

    ordering = ['email']
    list_display = ['email', 'name', 'is_active']
    exclude = ['first_name', 'last_name', 'username', 'date_joined']

    list_filter = ['is_staff', 'is_superuser', 'is_active', 'groups']
    search_fields = ['email']
    filter_horizontal = ['groups', 'user_permissions']
    fieldsets = (
        ('Personal info', {'fields': ('email', 'password')}),
        ('Important dates', {'fields': ('last_login',)}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
    )


admin.site.register(User, CustomUserAdmin)
