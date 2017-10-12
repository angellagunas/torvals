from app.domains.models import Domain

from django import forms


class DomainAdminForm(forms.ModelForm):
    class Meta:
        model = Domain
        fields = [
            'id',
            'name',
            'server',
            'provider',
        ]
