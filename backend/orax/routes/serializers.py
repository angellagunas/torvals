"""Serializer for channels API."""
from rest_framework import serializers

from orax.routes.models import Route


class RouteSerializer(serializers.ModelSerializer):
    """Serializer for Route API when GET method is used."""

    class Meta:
        """Define the behavior of Serializer."""

        model = Route
        fields = '__all__'
