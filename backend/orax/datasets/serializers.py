"""Serializer for Dataset rows API."""
from rest_framework import serializers

from orax.datasets.models import DatasetRow
from orax.products.serializers import ProductSerializer
from orax.sales_centers.serializers import SaleCenterSerializer


class DatasetrowSerializer(serializers.ModelSerializer):
    """Serializer for Datasetrows API when GET method is used."""

    product = ProductSerializer()
    sale_center = SaleCenterSerializer()

    class Meta:
        """Define the behavior of Serializer."""

        model = DatasetRow
        fields = [
            'id',
            'product',
            'sale_center',
            'prediction',
            'adjustment',
            'date',
            'transit',
            'in_stock',
            'safety_stock',
            'bed',
            'pallet',
        ]


class DatasetrowUpdateSerializer(serializers.ModelSerializer):
    """Serializer for Datasetrows API when PATCH method is used."""

    class Meta:
        """Define the behavior of Serializer."""

        model = DatasetRow
        fields = [
            'id',
            'adjustment'
        ]
