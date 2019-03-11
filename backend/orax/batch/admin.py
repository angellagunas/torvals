"""Admin for routes module."""
import math
import pandas as pd

from django import forms
from django.contrib import admin
from orax.batch.models import Batch
from orax.organizations.models import Organization
from orax.products.models import Product
from orax.routes.models import Route
from orax.sales_centers.models import SaleCenter


class BatchForm(forms.ModelForm):
    """Form to admin batchs."""

    class Meta:
        """Define behavior of class."""

        model = Batch
        exclude = []


class BatchAdmin(admin.ModelAdmin):
    """Admin to manage batchs."""

    model = Batch
    list_display = ['name', 'description', 'type', 'is_active']
    search_fields = ['name', 'description', 'type']

    def save_model(self, request, obj, form, change):
        """Save instance."""
        org = Organization.objects.latest('created_date')
        model_config = {
            'products': {
                'id': 'product_id',
                'name': 'product_name',
                'model': Product
            },
            'routes': {
                'id': 'route_id',
                'name': 'route_name',
                'model': Route
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

        super(BatchAdmin, self).save_model(request, obj, form, change)

        #
        # only the new catalog should be active.
        #
        config['model'].objects.filter(is_active=True).update(is_active=False)

        #
        # save all new catalogs
        #
        for index, row in file.iterrows():
            _id = row.get(config['id'], None)

            external_id = int(float(_id)) if _id else 'N/A'

            data = {
                'organization_id': org.id,
                'external_id': external_id,
                'name': row.get(config['name'], 'N/A')
            }

            if obj.type == 'products':
                price = float(row['price'])
                price = 0 if math.isnan(price) else price

                quota = float(row['quota'])
                quota = 0 if math.isnan(quota) else quota

                data['price'] = price
                data['quota'] = quota

            config['model'].objects.create(**data)


admin.site.register(Batch, BatchAdmin)