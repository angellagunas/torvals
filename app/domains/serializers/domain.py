# -*- coding: utf-8 -*-
from app.domains.models import Domain

from soft_drf.api.serializers import ModelSerializer


class DomainSerializer(ModelSerializer):

    class Meta:
        model = Domain
        fields = (
            'id',
            'name',
            'server',
            'provider',
        )
