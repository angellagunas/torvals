from app.apps.models import AppType

from django import forms


class AppTypeAdminForm(forms.ModelForm):
    class Meta:
        model = AppType
        fields = [
            'id',
            'name',
        ]
