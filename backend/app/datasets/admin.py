"""Admin for dataset module."""
from django import forms
from django.contrib import admin
from django.http import HttpResponse

<<<<<<< HEAD
=======
from django_json_widget.widgets import JSONEditorWidget

>>>>>>> bf53bf6c8afbfaeb4d69655ccbc30bff3a7d401a
from app.datasets.models import Dataset, DatasetRow
from app.datasets.utils import load_dataset


class DatasetForm(forms.ModelForm):
    """Form to admin dataset."""

    class Meta:
        """Define behavior of class."""

        model = Dataset
        exclude = []


class DatasetAdmin(admin.ModelAdmin):
    """Admin to manage datasets."""

    list_display = [
        'name',
        'description',
        'is_active',
        'is_main',
        'date_adjustment',
        'project'
    ]
    search_fields = ['name', 'description', 'project__name']
    actions = ["export_as_csv"]

    def export_as_csv(self, request, queryset):
        """Export current dataset to csv."""
        dataset = queryset[0]

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename={}.csv'.format(
            dataset.name + '_adjustements'
        )

        dataset.to_web_csv(response)

        return response

    export_as_csv.short_description = "Export selected dataset to csv."

    def save_model(self, request, obj, form, change):
        """Save instance."""
        #
        # Set property is_main to all datasets. The new dataset should be only
        # one with this property as True.
        #
        Dataset.objects.filter(
            is_main=True,
            project=obj.project
        ).update(is_main=False)

        #
        # The new dataset always be main dataset.
        #
        obj.is_main = True

        #
        # Execute the normal flow of admin save.
        #
        super(DatasetAdmin, self).save_model(request, obj, form, change)
        load_dataset(obj)


class DatasetRowsForm(forms.ModelForm):
    """Form to dataset row."""

    class Meta:
        """Define the class behavior."""

        model = DatasetRow
        fields = '__all__'
        widgets = {
            'extra_columns': JSONEditorWidget(mode='code')
        }


class DatasetRowsAdmin(admin.ModelAdmin):
    """Admin to manage rows."""

    form = DatasetRowsForm
    model = DatasetRow
    list_display = [
        'product',
        'sale_center',
        'date',
        'dataset',
        'extra_columns'
    ]
    search_fields = ['dataset']
    list_filter = ['dataset', 'sale_center']

    def get_queryset(self, request):
        """Overwrite queryset."""
        qs = super(DatasetRowsAdmin, self).get_queryset(request)
        try:
            ds = Dataset.objects.filter(is_main=True)
        except Exception as e:  # noqa
            ds = Dataset.objects.all()

        return qs.filter(dataset__in=ds)


admin.site.register(DatasetRow, DatasetRowsAdmin)
admin.site.register(Dataset, DatasetAdmin)
