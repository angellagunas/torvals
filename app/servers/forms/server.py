from app.servers.models import Server

from django import forms


class ServerAdminForm(forms.ModelForm):
    class Meta:
        model = Server
        fields = [
            'id',
            'name',
            'ip_v4',
            'ip_v6'
        ]
