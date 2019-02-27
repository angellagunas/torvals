"""Serializer for Dataset rows API."""
from rest_framework import serializers

from orax.datasetrows.models import DatasetRow
from orax.channels.serializers import ChannelSerializer
from orax.periods.serializers import PeriodSerializer
from orax.products.serializers import ProductSerializer
from orax.sales_centers.serializers import SaleCenterSerializer


class DatasetrowSerializer(serializers.ModelSerializer):
    """Serializer for Datasetrows API when GET method is used."""

    channel = ChannelSerializer()
    product = ProductSerializer()
    sale_center = SaleCenterSerializer()
    period = PeriodSerializer()

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
            'period',
            'sale',
            'refund',
            'date'
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
