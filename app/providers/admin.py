from app.providers.forms.provider import ProviderAdminForm

from app.providers.models import (
    Provider,
)

from django.contrib import admin


class ProviderAdmin(admin.ModelAdmin):
    form = ProviderAdminForm
    list_display = [
        'id',
        'name',
    ]

    search_fields = [
        'id',
        'name',
    ]


admin.site.register(Provider, ProviderAdmin)
