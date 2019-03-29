"""Serializer for projects API."""
from rest_framework import serializers

from orax.projects.models import Project


class ProjectSerializer(serializers.ModelSerializer):
    """Serializer for projects API when GET method is used."""

    class Meta:
        """Define the behavior of Serializer."""

        model = Project
        fields = [
            'id',
            'can_adjust',
            'can_dowload_report',
            'can_send_report',
            'name',
            'date',
            'ceve_id',
            'product_id',
            'transits',
            'in_stock',
            'safety_stock',
            'prediction',
            'adjustment',
            'beds',
            'pallets'
        ]
