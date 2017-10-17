from app.documentation.forms.documentationtype import DocumentationTypeAdminForm
from app.documentation.forms.documentation import DocumentationAdminForm
from app.documentation.forms.answer import AnswerAdminForm

from app.documentation.models import (
    DocumentationType,
    Documentation,
    Answer,
)

from django.contrib import admin


class DocumentationTypeAdmin(admin.ModelAdmin):
    form = DocumentationTypeAdminForm
    list_display = [
        'id',
        'name',
    ]

    search_fields = [
        'id',
        'name',
    ]


class DocumentationAdmin(admin.ModelAdmin):
    form = DocumentationAdminForm
    list_display = [
        'id',
        'title',
        'body',
        'type',
        'author',
    ]

    search_fields = [
        'id',
        'title',
        'body',
        'type',
        'author',
    ]


class AnswerAdmin(admin.ModelAdmin):
    form = AnswerAdminForm
    list_display = [
        'id',
        'body',
        'author',
    ]

    search_fields = [
        'id',
        'body',
        'author',
    ]


admin.site.register(DocumentationType, DocumentationTypeAdmin)
admin.site.register(Documentation, DocumentationAdmin)
admin.site.register(Answer, AnswerAdmin)
