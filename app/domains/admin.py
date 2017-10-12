from app.domains.forms.domain import DomainAdminForm

from app.domains.models import (
    Domain,
)

from django.contrib import admin


class DomainAdmin(admin.ModelAdmin):
    form = DomainAdminForm
    list_display = [
        'id',
        'name',
        'server',
        'provider',
    ]

    search_fields = [
        'id',
        'name',
        'server',
        'provider',
    ]


admin.site.register(Domain, DomainAdmin)
