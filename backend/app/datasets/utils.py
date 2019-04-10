import math

from datetime import datetime

from app.datasets.models import Dataset, DatasetRow
from app.products.models import Product
from app.sales_centers.models import SaleCenter

import pandas as pd


def get_or_create(key, row, dict_data, model, project):
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


def convert_nan_to_zero(number):
    return 0 if math.isnan(number) else number


def get_extra_columns_from_row(row, columns):
    dict_columns = {}
    for column in columns:
        value = row[column]
        if isinstance(value, str):
            dict_columns[column] = value
        else:
            dict_columns[column] = convert_nan_to_zero(row[column])

    return dict_columns


def load_dataset(obj):
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
        (product_id, products_dict) = get_or_create(
            project.product_id,
            row,
            products_dict,
            Product,
            project
        )

        (sale_center_id, sales_centers_dict) = get_or_create(
            project.ceve_id,
            row,
            sales_centers_dict,
            SaleCenter,
            project
        )

        date = datetime.strptime(row[project.date], "%Y-%m-%d").date()

        dict_extra_columns = get_extra_columns_from_row(
            row,
            extra_columns
        )
        try:
            DatasetRow.objects.create(
                dataset_id=dataset.id,
                product_id=product_id,
                sale_center_id=sale_center_id,
                date=date,
                extra_columns=dict_extra_columns
            )
        except Exception as e:
            raise e
