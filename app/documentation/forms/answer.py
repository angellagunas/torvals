from app.documentation.models import Answer

from django import forms


class AnswerAdminForm(forms.ModelForm):
    class Meta:
        model = Answer
        fields = [
            'id',
            'body',
            'author',
        ]
