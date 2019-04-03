"""Tests for users API."""
from rest_framework import status
from rest_framework.test import APITestCase

from app.users.models import User


class LoginTests(APITestCase):
    """Test all cases in login."""

    def setUp(self):
        """Function to execute before of all tests."""
        pass

    def create_user(self):
        """Create a user in DB."""
        return User.objects.create_superuser(
            email='test@intelligence.com',
            password="123intelligence"
        )

    def test_login_successfully(self):
        """Test login succesfully."""
        endpoint_url = '/api/v2/auth'
        user = self.create_user()
        data = {'email': user.email, 'password': '123intelligence'}
        response = self.client.post(endpoint_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_login_failure(self):
        """Test login failure."""
        endpoint_url = '/api/v2/auth'
        user = self.create_user()
        data = {'email': user.email, 'password': 'badpassword'}
        response = self.client.post(endpoint_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
