"""Admin for users module."""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import Group, Permission
from django.contrib.postgres.fields import ArrayField

from app.users.models import User
from app.utils.widgets import Select2TagWidgetArray


class CustomUserAdmin(UserAdmin):
    """Admin for user."""

    ordering = ['email']
    filter_vertical = ['sale_center']
    list_display = ['email', 'name', 'is_active', 'project']
    exclude = ['first_name', 'last_name', 'username', 'date_joined']

    list_filter = ['is_staff', 'is_superuser', 'is_active', 'groups']
    search_fields = ['email']
    filter_horizontal = ['groups', 'user_permissions']
    fieldsets = (
        ('Personal info', {'fields': ('email', 'password')}),
        ('Important dates', {'fields': ('last_login',)}),
        ('Organization config', {
            'fields': ('sale_center', 'project', 'admin_emails')
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
            'fields': ('sale_center', 'project', 'admin_emails')
        }),
        ('Permissions', {'fields': (
            'is_active',
            'is_staff',
            'is_superuser',
            'groups', 'user_permissions')
        }),
    )

    formfield_overrides = {
        ArrayField: {
            'widget': Select2TagWidgetArray
        },
    }

    class Media:
        """Load external assets."""

        js = (
            'https://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js',
        )


admin.site.register(User, CustomUserAdmin)
admin.site.unregister(Group)
admin.site.register(Group)
admin.site.register(Permission)
