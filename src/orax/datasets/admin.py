"""Admin for dataset module."""
import pandas as pd

from django import forms
from django.contrib import admin
from orax.datasets.models import Dataset
from orax.datasetrows.models import DatasetRow


class DatasetForm(forms.ModelForm):
    """Form to admin dataset."""

    class Meta:
        """Define behavior of class."""

        model = Dataset
        exclude = []


class DatasetAdmin(admin.ModelAdmin):
    """Admin to manage datasets."""

    def save_model(self, request, obj, form, change):
        """Save instance."""
        file = pd.read_csv(obj.file, sep='|', index_col=False)
        super(DatasetAdmin, self).save_model(request, obj, form, change)
        dataset = Dataset.objects.latest('created_date')

        for index, row in file.iterrows():
            DatasetRow.objects.create(
                dataset_id=dataset.id,
                organization_id=1,
                project_id=1,
                product_id=1,
                channel_id=1,
                sale_center_id=1,
                cycle_id=1,
                period_id=1,
                status='unmodified',
                prediction=row['units'],
                adjustment=row['units']
            )


admin.site.register(Dataset, DatasetAdmin)
