"""Tests for users API."""
from rest_framework import status
from rest_framework.test import APITestCase

from app.utils.testing.dummy_data import create_project
from app.utils.testing.dummy_data import create_sales_center
from app.utils.testing.dummy_data import create_user


class LoginTests(APITestCase):
    """Test all cases in login."""

    def setUp(self):
        """Function to execute before of all tests."""
        pass

    def test_login_user_not_found(self):
        """Test login with no user in DataBase."""
        endpoint_url = '/api/v1/auth'
        user = create_user()
        project = create_project()
        user.project_id = project.id
        user.save()
        ceve = create_sales_center()
        user.sale_center.add(ceve)
        data = {
            'email': 'dummy@intelligence.com',
            'password': '123intelligence'
        }
        response = self.client.post(endpoint_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_user_is_active(self):
        """ Test login with user not active. """
        endpoint_url = '/api/v1/auth'
        user = create_user()
        user.is_active = False
        project = create_project()
        user.project_id = project.id
        user.save()
        ceve = create_sales_center()
        user.sale_center.add(ceve)
        data = {
            'email': 'test@intelligence.com',
            'password': '123intelligence'
        }
        response = self.client.post(endpoint_url, data, format='json')
        print(response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_user_incorrectly_inputed(self):
        """Test login with capitals in the user email."""
        endpoint_url = '/api/v1/auth'
        user = create_user()
        project = create_project()
        user.project_id = project.id
        user.save()
        ceve = create_sales_center()
        user.sale_center.add(ceve)
        data = {
            'email': 'TeSt@intelligence.com',
            'password': '123intelligence'
        }
        response = self.client.post(endpoint_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_user_succesfully_inputed(self):
        """ Test login with correct input in the user email. """
        endpoint_url = '/api/v1/auth'
        user = create_user()
        project = create_project()
        user.project_id = project.id
        user.save()
        ceve = create_sales_center()
        user.sale_center.add(ceve)
        data = {
            'email': 'test@intelligence.com',
            'password': '123intelligence'
        }
        response = self.client.post(endpoint_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_login_bad_password(self):
        """ Text login with incorrect password """
        endpoint_url = '/api/v1/auth'
        user = create_user()
        project = create_project()
        user.project_id = project.id
        user.save()
        ceve = create_sales_center()
        user.sale_center.add(ceve)
        data = {'email': user.email, 'password': 'incorrect_password'}
        response = self.client.post(endpoint_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_correct_password(self):
        """ Text login with correct password """
        endpoint_url = '/api/v1/auth'
        user = create_user()
        project = create_project()
        user.project_id = project.id
        user.save()
        ceve = create_sales_center()
        user.sale_center.add(ceve)
        data = {'email': user.email, 'password': '123intelligence'}
        response = self.client.post(endpoint_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_login_user_without_assigned_project(self):
        """ Test login user with unassigned project """
        endpoint_url = '/api/v1/auth'
        user = create_user()
        project = create_project()
        user.project_id = project.id
        ceve = create_sales_center()
        user.sale_center.add(ceve)
        data = {
            'email': user.email,
            'password': '123intelligence'
        }
        response = self.client.post(endpoint_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_user_without_assigned_sales_centers(self):
        """ Test login user with unassigned sales_centers """
        endpoint_url = '/api/v1/auth'
        user = create_user()
        project = create_project()
        user.project_id = project.id
        user.save()
        create_sales_center()
        data = {
            'email': user.email,
            'password': '123intelligence'
        }
        response = self.client.post(endpoint_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
