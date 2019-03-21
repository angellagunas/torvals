"""Admin for users module."""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from orax.users.models import User


class CustomUserAdmin(UserAdmin):
    """Admin for user."""

    ordering = ['email']
    filter_vertical = ['sale_center']
    list_display = ['email', 'name', 'is_active']
    exclude = ['first_name', 'last_name', 'username', 'date_joined']
    raw_id_fields = ('project',)

    list_filter = ['is_staff', 'is_superuser', 'is_active', 'groups']
    search_fields = ['email']
    filter_horizontal = ['groups', 'user_permissions']
    fieldsets = (
        ('Personal info', {'fields': ('email', 'password')}),
        ('Important dates', {'fields': ('last_login',)}),
        ('Organization config', {
            'fields': ('sale_center', 'project')
        }),
        ('Permissions', {'fields': (
            'is_active',
            'is_staff',
            'is_superuser',
            'can_edit',
            'groups', 'user_permissions')
        }),
    )

    add_fieldsets = (
        ('Personal info', {'fields': ('email', 'password1', 'password2')}),
        ('Important dates', {'fields': ('last_login',)}),
        ('Organization config', {
            'fields': ('sale_center', 'project')
        }),
        ('Permissions', {'fields': (
            'is_active',
            'is_staff',
            'is_superuser',
            'can_edit',
            'groups', 'user_permissions')
        }),
    )


admin.site.register(User, CustomUserAdmin)
