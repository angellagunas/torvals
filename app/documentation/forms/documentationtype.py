from app.documentation.models import DocumentationType

from django import forms


class DocumentationTypeAdminForm(forms.ModelForm):
    class Meta:
        model = DocumentationType
        fields = [
            'id',
            'name',
        ]
