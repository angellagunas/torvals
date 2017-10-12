from app.servers.models import Environment

from django import forms


class EnvironmentAdminForm(forms.ModelForm):
    class Meta:
        model = Environment
        fields = [
            'id',
            'name',
            'server',
        ]
