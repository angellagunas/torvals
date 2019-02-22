"""Admin for dataset module."""
import pandas as pd

from django import forms
from django.contrib import admin
from orax.datasets.models import Dataset
from orax.organizations.models import Organization
from orax.projects.models import Project
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
        #
        # Set property is_main to all datasets. The new dataset should be only
        # one with this property as True.
        #
        Dataset.objects.filter(
            is_main=True
        ).update(is_main=False)

        #
        # The new dataset always be main dataset.
        #
        obj.is_main = True

        #
        # Open the new dataset file.
        #
        file = pd.read_csv(obj.file, sep='|', index_col=False)

        #
        # Execute the normal flow of admin save.
        #
        super(DatasetAdmin, self).save_model(request, obj, form, change)

        #
        # Get the new dataset, the last organization and project.
        #
        dataset = Dataset.objects.latest('created_date')
        org = Organization.objects.latest('created_date')
        project = Project.objects.lastest('created_date')

        #
        # Save all dataset rows.
        #
        for index, row in file.iterrows():
            DatasetRow.objects.create(
                dataset_id=dataset.id,
                organization_id=org.id,
                project_id=project.id,
                product_id=1,

                channel_id=1,
                sale_center_id=1,
                route=1,
                status='unmodified',
                prediction=row['units'],
                adjustment=row['units']
            )


admin.site.register(Dataset, DatasetAdmin)
