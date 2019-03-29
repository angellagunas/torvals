"""Admin for dataset module."""
import math

from datetime import datetime

from django import forms
from django.contrib import admin
from django.http import HttpResponse

import pandas as pd

from orax.datasets.models import Dataset, DatasetRow
from orax.products.models import Product
from orax.sales_centers.models import SaleCenter


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

        #
        # Open the new dataset file.
        #
        file = pd.read_csv(obj.file, sep=',', index_col=False)

        #
        # Get the new dataset.
        #
        dataset = Dataset.objects.order_by('-created_date')[0]
        project = obj.project

        products = Product.objects.filter(is_active=True)
        sales_centers = SaleCenter.objects.filter(is_active=True)
        #
        # For make better the performace, we do only one query to get all
        # products and sales centers and access to
        # their id by their external id.
        #
        products_dict = {}
        for p in products:
            products_dict[str(p.external_id)] = p.id

        sales_centers_dict = {}
        for sc in sales_centers:
            sales_centers_dict[sc.external_id] = sc.id

        #
        # adittional columns from new dataset
        #
        extra_columns = dataset.get_extra_columns()
        project.dynamic_columns_name = extra_columns
        project.save()
        #
        # Save all dataset rows.
        #
        for index, row in file.iterrows():
            (product_id, products_dict) = self._get_or_create(
                project.product_id,
                row,
                products_dict,
                Product,
                project
            )

            (sale_center_id, sales_centers_dict) = self._get_or_create(
                project.ceve_id,
                row,
                sales_centers_dict,
                SaleCenter,
                project
            )

            date = datetime.strptime(row[project.date], "%Y-%m-%d").date()

            transit = 0
            if project.transits:
                transit = self._zero_if_nan(row[project.transits])

            bed = 0
            if project.beds:
                bed = self._zero_if_nan(row[project.beds])

            pallet = 0
            if project.pallets:
                pallet = self._zero_if_nan(row[project.pallets])

            in_stock = self._zero_if_nan(row[project.in_stock])
            safety_stock = self._zero_if_nan(row[project.safety_stock])
            prediction = self._zero_if_nan(row[project.prediction])
            adjustment = self._zero_if_nan(row[project.adjustment])
            dict_extra_columns = self._get_extra_columns_from_row(
                row,
                extra_columns
            )
            try:
                DatasetRow.objects.create(
                    dataset_id=dataset.id,
                    product_id=product_id,
                    sale_center_id=sale_center_id,
                    prediction=prediction,
                    adjustment=adjustment,
                    date=date,
                    transit=transit,
                    in_stock=in_stock,
                    safety_stock=safety_stock,
                    bed=bed,
                    pallet=pallet,
                    extra_columns=dict_extra_columns
                )
            except Exception as e:
                print(row)
                print(e)
                raise e

    def _get_or_create(self, key, row, dict_data, model, project):
        external_id = str(row[key])
        internal_id = dict_data.get(external_id, None)

        if not internal_id:
            obj = model.objects.create(
                external_id=external_id,
                name='N/A',
                project=project
            )

            internal_id = obj.id

        dict_data[external_id] = internal_id

        return (internal_id, dict_data)

    def _zero_if_nan(self, value):
        number = int(float(value))
        return 0 if math.isnan(number) else number

    def _get_extra_columns_from_row(self, row, columns):
        dict_columns = {}
        for column in columns:
            dict_columns[column] = row[column]

        return dict_columns


class DatasetRowsAdmin(admin.ModelAdmin):
    """Admin to manage rows."""

    model = DatasetRow
    list_display = [
        'product',
        'sale_center',
        'prediction',
        'adjustment',
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
