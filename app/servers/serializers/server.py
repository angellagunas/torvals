# -*- coding: utf-8 -*-
from app.servers.models import Server

from soft_drf.api.serializers import ModelSerializer


class ServerSerializer(ModelSerializer):

    class Meta:
        model = Server
        fields = (
            'id',
            'name',
            'ip_v4',
        )
