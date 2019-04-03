"""Admin for routes module."""
import math

from django import forms
from django.contrib import admin

import pandas as pd

from app.batch.models import Batch
from app.products.models import Product
from app.sales_centers.models import SaleCenter


class BatchForm(forms.ModelForm):
    """Form to admin batchs."""

    class Meta:
        """Define behavior of class."""

        model = Batch
        exclude = []


class BatchAdmin(admin.ModelAdmin):
    """Admin to manage batchs."""

    model = Batch
    list_display = ['name', 'description', 'type', 'is_active', 'project']
    search_fields = ['name', 'description', 'type']

    def save_model(self, request, obj, form, change):
        """Save instance."""
        model_config = {
            'products': {
                'id': 'product_id',
                'name': 'product_name',
                'model': Product
            },
            'sales_centers': {
                'id': 'sale_center_id',
                'name': 'sale_center_name',
                'model': SaleCenter
            }
        }
        config = model_config[obj.type]

        file = pd.read_csv(
            obj.file,
            sep=obj.separated_by,
            index_col=False
        ).sort_values(
            config['name']
        ).drop_duplicates(
            subset=config['id'],
            keep='first'
        ).reset_index(
            drop=True
        )

        project = obj.project

        super(BatchAdmin, self).save_model(request, obj, form, change)

        #
        # only the new catalog should be active.
        #
        config['model'].objects.filter(
            is_active=True,
            project=project
        ).update(is_active=False)

        #
        # save all new catalogs
        #
        for index, row in file.iterrows():
            _id = row.get(config['id'], None)
            external_id = int(float(_id)) if _id else 'N/A'

            data = {
                'external_id': external_id,
                'name': row.get(config['name'], 'N/A'),
                'project': project
            }

            if obj.type == 'products':
                price = float(row['price'])
                price = 0 if math.isnan(price) else price
                data['price'] = price

                quota = float(row['quota'])
                quota = 0 if math.isnan(quota) else quota
                data['quota'] = quota

                bed = float(row['bed'])
                bed = 0 if math.isnan(bed) else bed
                data['bed'] = bed

                pallet = float(row['pallet'])
                pallet = 0 if math.isnan(pallet) else pallet
                data['pallet'] = pallet

            config['model'].objects.create(**data)


admin.site.register(Batch, BatchAdmin)
