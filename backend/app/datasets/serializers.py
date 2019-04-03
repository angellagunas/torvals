"""Serializer for Dataset rows API."""
from rest_framework import serializers

from app.datasets.models import DatasetRow
from app.products.serializers import ProductSerializer
from app.sales_centers.serializers import SaleCenterSerializer


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
            'date',
            'extra_columns'
        ]


class DatasetrowUpdateSerializer(serializers.ModelSerializer):
    """Serializer for Datasetrows API when PATCH method is used."""

    class Meta:
        """Define the behavior of Serializer."""

        model = DatasetRow
        fields = '__all__'
