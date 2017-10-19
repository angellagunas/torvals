from django.core.urlresolvers import reverse

from rest_framework import status
from rest_framework.test import APITestCase


class DocumensTests(APITestCase):

    def test_documentations_list_without_token(self):
        endpoint_url = reverse(
            'api:v1:documentations-list',
            kwargs={}
        )
        response = self.client.get(endpoint_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
