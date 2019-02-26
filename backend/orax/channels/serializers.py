"""Serializer for channels API."""
from rest_framework import serializers

from orax.channels.models import Channel


class ChannelSerializer(serializers.ModelSerializer):
    """Serializer for Channel API when GET method is used."""

    class Meta:
        """Define the behavior of Serializer."""

        model = Channel
        fields = '__all__'
