"""Admin for dataset module."""
import csv
import math
import pandas as pd
from datetime import datetime

from django import forms
from django.contrib import admin
from django.http import HttpResponse
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
        'date_adjustment'
    ]
    search_fields = ['name', 'description']
    actions = ["export_as_csv"]

    def export_as_csv(self, request, queryset):
        """Export current dataset to csv."""
        dataset = queryset[0]
        columns = [
            'product_id',
            'product_description',
            'sale_center_id',
            'date',
            'suggested',
            'adjustment'
        ]

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename={}.csv'.format(
            dataset.name + '_adjustements'
        )
        writer = csv.writer(response)
        writer.writerow(columns)

        rows = DatasetRow.objects.filter(
            dataset_id=dataset.id,
            date=dataset.date_adjustment
        )

        for row in rows:
            product_id = row.product.external_id
            product_name = row.product.name
            sale_center_id = row.sale_center.external_id
            date = row.date
            suggested = row.prediction
            adjustment = row.adjustment

            row = writer.writerow([
                product_id,
                product_name,
                sale_center_id,
                date,
                suggested,
                adjustment
            ])

        return response

    export_as_csv.short_description = "Export selected dataset to csv."

    def save_model(self, request, obj, form, change):
        """Save instance."""
        #
        # Set property is_main to all datasets. The new dataset should be only
        # one with this property as True.
        #
        Dataset.objects.filter(is_main=True).update(is_main=False)

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
        # the active rows should be only the new rows.
        #
        DatasetRow.objects.filter(is_active=True).update(is_active=False)

        #
        # Save all dataset rows.
        #
        for index, row in file.iterrows():
            product_id = self._get_or_create(
                'ITEM',
                row,
                products_dict,
                Product
            )

            sale_center_id = self._get_or_create(
                'ceve_id',
                row,
                sales_centers_dict,
                SaleCenter
            )

            date = datetime.strptime(row['fecha_de_venta'], "%Y-%m-%d").date()

            transit = self._zero_if_nan(row['transitos'])
            in_stock = self._zero_if_nan(row['existencia'])
            safety_stock = self._zero_if_nan(row['safety_stock'])
            prediction = self._zero_if_nan(row['sugerido'])
            adjustment = self._zero_if_nan(row['sugerido'])
            bed = self._zero_if_nan(row['pedido_final_camas'])
            pallet = self._zero_if_nan(row['pedido_final_tarimas'])

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
                    pallet=pallet
                )
            except Exception as e:
                print(row)
                print(e)
                raise e

    def _get_or_create(self, key, row, dict_data, model):
        external_id = str(row[key])
        internal_id = dict_data.get(external_id, None)

        if not internal_id:
            name = row['producto'] if key == 'item' else 'NA'
            obj = model.objects.create(
                external_id=external_id,
                name=name
            )

            internal_id = obj.id

        return internal_id

    def _zero_if_nan(self, value):
        number = int(float(value))
        return 0 if math.isnan(number) else number


class DatasetRowsAdmin(admin.ModelAdmin):
    """Admin to manage rows."""

    model = DatasetRow
    list_display = [
        'product',
        'sale_center',
        'prediction',
        'adjustment',
        'date'
    ]
    search_fields = ['product']

    def get_queryset(self, request):
        """Overwrite queryset."""
        qs = super(DatasetRowsAdmin, self).get_queryset(request)
        ds = Dataset.objects.get(is_main=True)
        return qs.filter(is_active=True, dataset=ds)


admin.site.register(DatasetRow, DatasetRowsAdmin)
admin.site.register(Dataset, DatasetAdmin)
