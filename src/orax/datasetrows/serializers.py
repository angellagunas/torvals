"""Serializer for Dataset rows API."""
from rest_framework import serializers

from orax.datasetrows.models import DatasetRow


class DatasetrowSerializer(serializers.ModelSerializer):
    """Serializer for Datasetrows API when GET method is used."""

    class Meta:
        """Define the behavior of Serializer."""

        model = DatasetRow
        fields = [
            'id',
            'product',
            'channel',
            'sale_center',
            'prediction',
            'adjustment',
            'period'
        ]


class DatasetrowUpdateSerializer(serializers.ModelSerializer):
    """Serializer for Elasticity API when PATCH method is used."""

    class Meta:
        """Define the behavior of Serializer."""

        model = DatasetRow
        fields = [
            'id',
            'adjustment'
        ]
