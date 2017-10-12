# -*- coding: utf-8 -*-
from app.providers.models import Provider
from app.providers.serializers import provider as serializers

from soft_drf.api import mixins
from soft_drf.api.viewsets import GenericViewSet


class ProviderViewSet(
    GenericViewSet,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.PartialUpdateModelMixin,
    mixins.DestroyModelMixin,
):
    serializer_class = serializers.ProviderSerializer
    list_serializer_class = serializers.ProviderSerializer
    retrieve_serializer_class = serializers.ProviderSerializer
    create_serializer_class = serializers.ProviderSerializer
    update_serializer_class = serializers.ProviderSerializer

    permission_classes = []  # put your custom permissions here

    def get_queryset(self, *args, **kwargs):
        queryset = Provider.objects.all()
        return queryset
