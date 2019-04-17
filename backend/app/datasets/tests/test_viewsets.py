"""Tests for datasets API."""

from rest_framework import status
from rest_framework.test import APITestCase

from app.utils.testing.dummy_data import (
    create_datasets,
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

    def test_get_datasetrows(self):
        """ Function to create rows. """
        user = create_user()
        token = create_token(user)

        endpoint_url = '/api/v1/datasetrows'
        project = create_project()
        user.project_id = project.id
        user.save()
        ceve = create_sales_center()
        user.sale_center.add(ceve)
        dataset = create_datasets()

        # self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + token)

        response = self.client.get(endpoint_url, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
