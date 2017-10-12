# -*- coding: utf-8 -*-
from app.providers.models import Provider

from soft_drf.api.serializers import ModelSerializer


class ProviderSerializer(ModelSerializer):

    class Meta:
        model = Provider
        fields = (
            'id',
            'name',
        )
