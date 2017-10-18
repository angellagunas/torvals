# -*- coding: utf-8 -*-
from app.servers.models import Environment
from app.servers.serializers import environment as serializers

from soft_drf.api import mixins
from soft_drf.api.viewsets import GenericViewSet


class EnvironmentViewSet(
    GenericViewSet,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.PartialUpdateModelMixin,
    mixins.DestroyModelMixin,
):
    serializer_class = serializers.EnvironmentSerializer
    list_serializer_class = serializers.EnvironmentSerializer
    retrieve_serializer_class = serializers.EnvironmentSerializer
    create_serializer_class = serializers.EnvironmentSerializer
    update_serializer_class = serializers.EnvironmentSerializer

    def get_queryset(self, *args, **kwargs):
        queryset = Environment.objects.all()
        return queryset
