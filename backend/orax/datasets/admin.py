"""Admin for dataset module."""
import csv
import math
import pandas as pd
from datetime import datetime

from django import forms
from django.contrib import admin
from django.http import HttpResponse
from orax.datasets.models import Dataset
from orax.organizations.models import Organization
from orax.projects.models import Project
from orax.products.models import Product
from orax.routes.models import Route
from orax.datasetrows.models import DatasetRow
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
            'route_id',
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
            route_id = row.route.external_id
            date = row.date
            suggested = row.prediction
            adjustment = row.adjustment

            row = writer.writerow([
                product_id,
                product_name,
                sale_center_id,
                route_id,
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
        original_file = pd.read_csv(obj.file, sep=',', index_col=False)
        file = original_file[original_file['date'] == '2019-02-28']

        #
        # Execute the normal flow of admin save.
        #
        super(DatasetAdmin, self).save_model(request, obj, form, change)

        #
        # Get the new dataset, the last organization and project.
        #
        dataset = Dataset.objects.order_by('-created_date')[0]
        org = Organization.objects.order_by('-created_date')[0]
        project = Project.objects.order_by('-created_date')[0]

        products = Product.objects.filter(is_active=True)
        routes = Route.objects.filter(is_active=True)
        sales_centers = SaleCenter.objects.filter(is_active=True)
        #
        # For make better the performace, we do only one query to get all
        # products, routes and sales centers and access to
        # their id by their external id.
        #
        products_dict = {}
        for p in products:
            products_dict[str(p.external_id)] = p.id

        routes_dict = {}
        for r in routes:
            routes_dict[str(r.external_id)] = r.id

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
            product_id = products_dict[str(row['product_id'])]
            route_id = routes_dict[str(row['cod_ruta_id'])]
            sale_center_id = sales_centers_dict[str(row['cod_agencia_id'])]
            date = datetime.strptime(row['date'], "%Y-%m-%d").date()

            sale = float(row['last_8wk_avg_sales_units'])
            sale = 0 if math.isnan(sale) else sale

            refund = float(row['last_8wk_avg_return_units'])
            refund = 0 if math.isnan(refund) else refund

            prediction = int(float(row['Units']))
            prediction = prediction if prediction >= 0 else (prediction * -1)

            adjustment = int(float(row['Units']))
            adjustment = adjustment if adjustment >= 0 else (adjustment * -1)

            try:
                DatasetRow.objects.create(
                    dataset_id=dataset.id,
                    organization_id=org.id,
                    project_id=project.id,
                    product_id=product_id,
                    route_id=route_id,
                    sale_center_id=sale_center_id,
                    status='unmodified',
                    sale=sale,
                    refund=refund,
                    prediction=prediction,
                    adjustment=adjustment,
                    date=date
                )
            except Exception as e:
                print(row)
                print('*************************')
                print(prediction)
                print(adjustment)
                print(e)
                raise e


admin.site.register(Dataset, DatasetAdmin)
