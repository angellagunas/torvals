# -*- coding: utf-8 -*-
from app.apps.models import AppType
from app.apps.serializers import apptype as serializers

from soft_drf.api import mixins
from soft_drf.api.viewsets import GenericViewSet


class AppTypeViewSet(
    GenericViewSet,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.PartialUpdateModelMixin,
    mixins.DestroyModelMixin,
):
    serializer_class = serializers.AppTypeSerializer
    list_serializer_class = serializers.AppTypeSerializer
    retrieve_serializer_class = serializers.AppTypeSerializer
    create_serializer_class = serializers.AppTypeSerializer
    update_serializer_class = serializers.AppTypeSerializer

    permission_classes = []  # put your custom permissions here

    def get_queryset(self, *args, **kwargs):
        queryset = AppType.objects.all()
        return queryset
