# -*- coding: utf-8 -*-
from app.apps.models import App

from soft_drf.api.serializers import ModelSerializer


class AppSerializer(ModelSerializer):

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
