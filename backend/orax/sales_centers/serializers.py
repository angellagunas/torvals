"""Serializer for salescenter API."""
from rest_framework import serializers

from orax.sales_centers.models import SaleCenter


class SaleCenterSerializer(serializers.ModelSerializer):
    """Serializer for salescenter API when GET method is used."""

    class Meta:
        """Define the behavior of Serializer."""

        model = SaleCenter
        fields = [
            'id',
            'external_id',
            'name'
        ]
