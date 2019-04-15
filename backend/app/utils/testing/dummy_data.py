from datetime import datetime

from app.datasets.models import Dataset
from app.projects.models import Project
from app.sales_centers.models import SaleCenter
from app.users.models import User


def create_project():
    """ Function that creates a project. """
    return Project.objects.create(
        created_date=datetime.now(),
        last_modified=datetime.now(),
        name='Merida',
        description='Proyecto a validar'
    )


def create_user():
    """ Function that creates a user. """
    return User.objects.create_superuser(
        email='test@intelligence.com',
        password='123intelligence'
    )


def create_sales_center():
    """ Function that creates a sales center. """
    return SaleCenter.objects.create(
        created_date=datetime.now(),
        last_modified=datetime.now(),
        name='ceve uno',
        external_id='1',
    )


def create_datasets():
    """ Function that creates a dataset. """
    return Dataset.objects.create(
        created_date=datetime.now(),
        last_modified=datetime.now(),
        name='dataset_tenderflake',
        is_active=True,
        file='fileField',
        description='dataset con csv',
        is_main=True,
        date_adjustment=datetime.now(),
        project_id=1
    )
