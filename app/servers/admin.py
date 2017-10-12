from app.servers.forms.environment import EnvironmentAdminForm
from app.servers.forms.server import ServerAdminForm

from app.servers.models import (
    Environment,
    Server,
)

from django.contrib import admin


class ServerAdmin(admin.ModelAdmin):
    form = ServerAdminForm
    list_display = [
        'id',
        'name',
        'ip_v4',
    ]

    search_fields = [
        'id',
        'name',
        'ip_v4',
    ]


class EnvironmentAdmin(admin.ModelAdmin):
    form = EnvironmentAdminForm
    list_display = [
        'id',
        'name'
    ]

    search_fields = [
        'id',
        'name',
        'server',
    ]


admin.site.register(Server, ServerAdmin)
admin.site.register(Environment, EnvironmentAdmin)
