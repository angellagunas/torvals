"""Serializer for products API."""
from rest_framework import serializers

from orax.products.models import Product


class ProductSerializer(serializers.ModelSerializer):
    """Serializer for products API when GET method is used."""

    class Meta:
        """Define the behavior of Serializer."""

        model = Product
        fields = '__all__'
