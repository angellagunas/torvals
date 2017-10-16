# -*- coding: utf-8 -*-
from app.apps.models import App
from app.apps.serializers.apptype import AppTypeSerializer

from soft_drf.api.serializers import ModelSerializer


class AppSerializer(ModelSerializer):
    type = AppTypeSerializer(many=False)

    class Meta:
        model = App
        fields = (
            'id',
            'name',
            'version',
            'source_URL',
            'notes',
            'type',
        )
