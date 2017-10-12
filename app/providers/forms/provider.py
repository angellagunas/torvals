from app.providers.models import Provider

from django import forms


class ProviderAdminForm(forms.ModelForm):
    class Meta:
        model = Provider
        fields = [
            'id',
            'name',
        ]
