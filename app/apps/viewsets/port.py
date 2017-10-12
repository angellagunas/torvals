# -*- coding: utf-8 -*-
from app.apps.models import Port
from app.apps.serializers import port as serializers

from soft_drf.api import mixins
from soft_drf.api.viewsets import GenericViewSet


class PortViewSet(
    GenericViewSet,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.PartialUpdateModelMixin,
    mixins.DestroyModelMixin,
):
    serializer_class = serializers.PortSerializer
    list_serializer_class = serializers.PortSerializer
    retrieve_serializer_class = serializers.PortSerializer
    create_serializer_class = serializers.PortSerializer
    update_serializer_class = serializers.PortSerializer

    permission_classes = []  # put your custom permissions here

    def get_queryset(self, *args, **kwargs):
        queryset = Port.objects.all()
        return queryset
