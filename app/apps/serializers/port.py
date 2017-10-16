# -*- coding: utf-8 -*-
from app.apps.models import Port
from app.apps.serializers.app import AppSerializer

from soft_drf.api.serializers import ModelSerializer


class PortSerializer(ModelSerializer):

    app = AppSerializer(many=False)

    class Meta:
        model = Port
        fields = (
            'id',
            'number',
            'app',
        )
