# -*- coding: utf-8 -*-
from app.apps.models import Port

from soft_drf.api.serializers import ModelSerializer


class PortSerializer(ModelSerializer):

    class Meta:
        model = Port
        fields = (
            'id',
            'number',
            'app',
        )
