# -*- coding: utf-8 -*-
from app.apps.models import App
from app.apps.serializers import app as serializers

from soft_drf.api import mixins
from soft_drf.api.viewsets import GenericViewSet


class AppViewSet(
    GenericViewSet,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.PartialUpdateModelMixin,
    mixins.DestroyModelMixin,
):
    serializer_class = serializers.AppSerializer
    list_serializer_class = serializers.AppSerializer
    retrieve_serializer_class = serializers.AppSerializer
    create_serializer_class = serializers.AppSerializer
    update_serializer_class = serializers.AppSerializer

    permission_classes = []  # put your custom permissions here

    def get_queryset(self, *args, **kwargs):
        queryset = App.objects.all()
        return queryset
