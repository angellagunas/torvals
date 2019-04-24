"""Admin for products module."""
from django import forms
from django.contrib import admin
from django.contrib.postgres.fields import ArrayField

from app.utils.widgets import Select2TagWidgetArray

from app.projects.models import Project


class ProjectForm(forms.ModelForm):
    """Form to project in django admin."""

    class Meta:
        """Define the class behavior."""

        model = Project
        fields = '__all__'


class ProjectAdmin(admin.ModelAdmin):
    """Project admin."""

    form = ProjectForm
    model = Project
    formfield_overrides = {
        ArrayField: {
            'widget': Select2TagWidgetArray
        },
    }

    class Media:
        """Load external assets."""

        js = (
            'https://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js',
        )


admin.site.register(Project, ProjectAdmin)
