from app.apps.forms.app import AppAdminForm
from app.apps.forms.apptype import AppTypeAdminForm
from app.apps.forms.port import PortAdminForm

from app.apps.models import (
    App,
    AppType,
    Port,
)

from django.contrib import admin


class AppTypeAdmin(admin.ModelAdmin):
    form = AppTypeAdminForm
    list_display = [
        'id',
        'name',
    ]

    search_fields = [
        'id',
        'name',
    ]


class AppAdmin(admin.ModelAdmin):
    form = AppAdminForm
    list_display = [
        'id',
        'name',
        'version',
        'source_URL',
        'notes',
        'type',
    ]

    search_fields = [
        'id',
        'name',
        'version',
        'source_URL',
        'notes',
        'type',
    ]


class PortAdmin(admin.ModelAdmin):
    form = PortAdminForm
    list_display = [
        'id',
        'number',
        'app',
    ]

    search_fields = [
        'id',
        'number',
        'app',
    ]


admin.site.register(AppType, AppTypeAdmin)
admin.site.register(App, AppAdmin)
admin.site.register(Port, PortAdmin)
