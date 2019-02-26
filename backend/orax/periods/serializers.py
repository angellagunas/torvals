"""Serializer for periods API."""
from rest_framework import serializers

from orax.periods.models import Period


class PeriodSerializer(serializers.ModelSerializer):
    """Serializer for periods API when GET method is used."""

    class Meta:
        """Define the behavior of Serializer."""

        model = Period
        fields = '__all__'
