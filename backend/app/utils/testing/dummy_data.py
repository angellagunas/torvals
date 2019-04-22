import json
from datetime import datetime

from app.datasets.models import Dataset, DatasetRow
from app.products.models import Product
from app.projects.models import Project
from app.sales_centers.models import SaleCenter
from app.users.models import User


def create_project(can_download_report=True, can_send_report=True):
    """ Function that creates a project. """
    return Project.objects.create(
        created_date=datetime.now(),
        last_modified=datetime.now(),
        name='Merida',
        description='Proyecto a validar',
        can_download_report=can_download_report,
        can_send_report=can_send_report
    )


def create_user(can_edit=True):
    """ Function that creates a user. """
    return User.objects.create_superuser(
        email='test@intelligence.com',
        password='123intelligence',
        can_edit=can_edit
    )


def create_sales_center():
    """ Function that creates a sales center. """
    project = Project.objects.last()
    return SaleCenter.objects.create(
        created_date=datetime.now(),
        last_modified=datetime.now(),
        name='ceve uno',
        external_id='1',
        project=project
    )


def create_product():
    """ Function that creates a product. """
    project = Project.objects.last()
    return Product.objects.create(
        created_date=datetime.now(),
        last_modified=datetime.now(),
        name='producto uno',
        is_active=True,
        price=0.99,
        quota=1,
        bed=1,
        pallet=1,
        external_id='1',
        type='A',
        project=project
    )


def create_datasets(is_main=True):
    """ Function that creates a dataset. """
    project = Project.objects.last()
    return Dataset.objects.create(
        created_date=datetime.now(),
        last_modified=datetime.now(),
        name='dataset_tenderflake',
        is_active=True,
        description='dataset con csv',
        is_main=is_main,
        date_adjustment=datetime.now(),
        project=project
    )


def create_datasetrows(dataset_id=1, product_id=1, sale_center_id=1):
    """ Function that creates a datasetrow. """
    return DatasetRow.objects.create(
        created_date=datetime.now(),
        last_modified=datetime.now(),
        dataset_id=dataset_id,
        product_id=product_id,
        sale_center_id=sale_center_id,
        is_active=True,
        date=datetime.today(),
        extra_columns=json.loads("""{
                "producto": "GOLDEN NUTS SEMILLA 20G BAR",
                "sugerido": 0,
                "transitos": 0,
                "existencia": 3,
                "pedidoFinal": 0,
                "safetyStock": 0,
                "pedidoFinalCamas": 0,
                "pedidoFinalTarimas": 0
            }""")
    )
