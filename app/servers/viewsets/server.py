# -*- coding: utf-8 -*-
from app.servers.models import Server
from app.servers.serializers import server as serializers

from soft_drf.api import mixins
from soft_drf.api.viewsets import GenericViewSet


class ServerViewSet(
    GenericViewSet,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.PartialUpdateModelMixin,
    mixins.DestroyModelMixin,
):
    serializer_class = serializers.ServerSerializer
    list_serializer_class = serializers.ServerSerializer
    retrieve_serializer_class = serializers.ServerSerializer
    create_serializer_class = serializers.ServerSerializer
    update_serializer_class = serializers.ServerSerializer

    permission_classes = []  # put your custom permissions here

    def get_queryset(self, *args, **kwargs):
        queryset = Server.objects.all()
        return queryset
