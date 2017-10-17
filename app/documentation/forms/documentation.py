from app.documentation.models import Documentation

from django import forms


class DocumentationAdminForm(forms.ModelForm):
    class Meta:
        model = Documentation
        fields = [
            'id',
            'title',
            'body',
            'type',
            'author',
        ]
