# -*- coding: utf-8 -*-
from app.servers.models import Environment

from soft_drf.api.serializers import ModelSerializer


class EnvironmentSerializer(ModelSerializer):

    class Meta:
        model = Environment
        fields = (
            'id',
            'name',
            'server',
        )
