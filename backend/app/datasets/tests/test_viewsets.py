"""Tests for datasets API."""
from rest_framework import status
from rest_framework.test import APITestCase

from app.utils.testing.dummy_data import (
    create_datasetrows,
    create_datasets,
    create_product,
    create_project,
    create_sales_center,
    create_user
)
from app.utils.tokens import create_token


class DatasetrowViewSetTests(APITestCase):
    """Test all cases in Datarow Viewset."""

    def setUp(self):
        """Function to execute before of all tests."""
        pass

    def test_get_datasetrows_with_token(self):
        """ Function to test rows with correct authentication. """
        user = create_user()
        token = create_token(user)

        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + token)

        endpoint_url = '/api/v1/datasetrows'
        project = create_project()
        user.project_id = project.id
        user.save()
        ceve = create_sales_center()
        user.sale_center.add(ceve)

        dataset = create_datasets()
        product = create_product()
        for x in range(1000):
            create_datasetrows(dataset.id, product.id, ceve.id)

        response = self.client.get(endpoint_url, format='json')
        self.assertEqual(len(response.data['results']), 1000)

    def test_get_datasetrows_without_token(self):
        """ Function to create rows and test them without authentication. """
        user = create_user()

        endpoint_url = '/api/v1/datasetrows'
        project = create_project()
        user.project_id = project.id
        user.save()
        ceve = create_sales_center()
        user.sale_center.add(ceve)

        dataset = create_datasets()
        product = create_product()
        for x in range(1000):
            create_datasetrows(dataset.id, product.id, ceve.id)

        response = self.client.get(endpoint_url, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_is_main_property_of_datasets(self):
        """ Function to test the active dataset. """
        user = create_user()
        token = create_token(user)

        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + token)

        endpoint_url = '/api/v1/datasetrows'
        project = create_project()
        user.project_id = project.id
        user.save()
        ceve = create_sales_center()
        user.sale_center.add(ceve)

        dataset_uno = create_datasets(is_main=False)
        dataset_dos = create_datasets()
        product = create_product()
        for x in range(1000):
            create_datasetrows(
                dataset_uno.id,
                product.id,
                ceve.id
            )
        for x in range(1000):
            create_datasetrows(
                dataset_dos.id,
                product.id,
                ceve.id
            )

        print(project, dataset_uno, dataset_dos)

        response = self.client.get(endpoint_url, format='json')
        self.assertEqual(len(response.data['results']), 1000)

    def test_can_download_report(self):
        """ Function to test if report download flag. """
        user = create_user()
        token = create_token(user)

        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + token)

        endpoint_url = '/api/v1/datasetrows/download'

        project = create_project()
        user.project_id = project.id
        user.save()
        ceve = create_sales_center()
        user.sale_center.add(ceve)
        print(project.report_columns)

        dataset = create_datasets()
        product = create_product()
        for x in range(1000):
            create_datasetrows(dataset.id, product.id, ceve.id)

        response = self.client.get(endpoint_url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_cannot_download_report(self):
        """ Function to test if report download flag. """
        user = create_user()

        endpoint_url = '/api/v1/datasetrows/download'

        project = create_project(can_download_report=False)
        user.project_id = project.id
        user.save()
        ceve = create_sales_center()
        user.sale_center.add(ceve)

        dataset = create_datasets()
        product = create_product()
        for x in range(1000):
            create_datasetrows(dataset.id, product.id, ceve.id)

        response = self.client.get(endpoint_url, format='json')
        self.assertEqual(response.status_code,
                         status.HTTP_401_UNAUTHORIZED)

    def test_can_send_report_and_can_edit(self):
        """ Function to test if report can be send and user can edit. """
        user = create_user()
        token = create_token(user)

        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + token)

        endpoint_url = '/api/v1/datasetrows/send'

        project = create_project()
        user.project_id = project.id
        user.save()
        ceve = create_sales_center()
        user.sale_center.add(ceve)
        print(project.report_columns)

        dataset = create_datasets()
        product = create_product()
        for x in range(1000):
            create_datasetrows(dataset.id, product.id, ceve.id)

        response = self.client.get(endpoint_url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_can_send_report_and_cannot_edit(self):
        """ Function to test if report can be send and user cannot edit. """
        user = create_user(can_edit=False)
        token = create_token(user)

        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + token)

        endpoint_url = '/api/v1/datasetrows/send'

        project = create_project()
        user.project_id = project.id
        user.save()
        ceve = create_sales_center()
        user.sale_center.add(ceve)
        print(project.report_columns)

        dataset = create_datasets()
        product = create_product()
        for x in range(1000):
            create_datasetrows(dataset.id, product.id, ceve.id)

        response = self.client.get(endpoint_url, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_cannot_send_report_and_can_edit(self):
        """ Function to test if report cannot be send and user can edit. """
        user = create_user()
        token = create_token(user)

        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + token)

        endpoint_url = '/api/v1/datasetrows/send'

        project = create_project(can_send_report=False)
        user.project_id = project.id
        user.save()
        ceve = create_sales_center()
        user.sale_center.add(ceve)
        print(project.report_columns)

        dataset = create_datasets()
        product = create_product()
        for x in range(1000):
            create_datasetrows(dataset.id, product.id, ceve.id)

        response = self.client.get(endpoint_url, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_cannot_send_report_and_cannot_edit(self):
        """ Function to test if report cannot be send and user cannot edit. """
        user = create_user(can_edit=False)
        token = create_token(user)

        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + token)

        endpoint_url = '/api/v1/datasetrows/send'

        project = create_project(can_send_report=False)
        user.project_id = project.id
        user.save()
        ceve = create_sales_center()
        user.sale_center.add(ceve)
        print(project.report_columns)

        dataset = create_datasets()
        product = create_product()
        for x in range(1000):
            create_datasetrows(dataset.id, product.id, ceve.id)

        response = self.client.get(endpoint_url, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
