"""Admin for users module."""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from orax.users.models import User


class CustomUserAdmin(UserAdmin):
    """Admin for user."""

    ordering = ['email']
    list_display = ['email', 'name', 'is_active', 'route']
    exclude = ['first_name', 'last_name', 'username', 'date_joined']

    list_filter = ['is_staff', 'is_superuser', 'is_active', 'groups']
    search_fields = ['email']
    filter_horizontal = ['groups', 'user_permissions']
    fieldsets = (
        ('Personal info', {'fields': ('email', 'password')}),
        ('Important dates', {'fields': ('last_login',)}),
        ('Organization config', {
            'fields': ('agency', 'route',)
        }),
        ('Permissions', {'fields': (
            'is_active',
            'is_staff',
            'is_superuser',
            'groups', 'user_permissions')
        }),
    )

    add_fieldsets = (
        ('Personal info', {'fields': ('email', 'password1', 'password2')}),
        ('Important dates', {'fields': ('last_login',)}),
        ('Organization config', {
            'fields': ('agency', 'route',)
        }),
        ('Permissions', {'fields': (
            'is_active',
            'is_staff',
            'is_superuser',
            'groups', 'user_permissions')
        }),
    )


admin.site.register(User, CustomUserAdmin)
