from app.apps.models import Port

from django import forms


class PortAdminForm(forms.ModelForm):
    class Meta:
        model = Port
        fields = [
            'id',
            'number',
            'app',
        ]
