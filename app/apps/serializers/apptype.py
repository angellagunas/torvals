# -*- coding: utf-8 -*-
from app.apps.models import AppType

from soft_drf.api.serializers import ModelSerializer


class AppTypeSerializer(ModelSerializer):

    class Meta:
        model = AppType
        fields = (
            'id',
            'name',
        )
