# -*- coding: utf-8 -*-
from app.domains.models import Domain
from app.providers.serializers.provider import ProviderSerializer

from soft_drf.api.serializers import ModelSerializer


class DomainSerializer(ModelSerializer):

    provider = ProviderSerializer(many=False)

    class Meta:
        model = Domain
        fields = (
            'id',
            'name',
            'server',
            'provider',
        )
