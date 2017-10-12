from app.apps.models import App

from django import forms


class AppAdminForm(forms.ModelForm):
    class Meta:
        model = App
        fields = [
            'id',
            'name',
            'version',
            'source_URL',
            'notes',
            'type',
        ]
