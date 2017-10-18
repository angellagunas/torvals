# -*- coding: utf-8 -*-
from app.domains.models import Domain
from app.domains.serializers import domain as serializers

from soft_drf.api import mixins
from soft_drf.api.viewsets import GenericViewSet


class DomainViewSet(
    GenericViewSet,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.PartialUpdateModelMixin,
    mixins.DestroyModelMixin,
):
    serializer_class = serializers.DomainSerializer
    list_serializer_class = serializers.DomainSerializer
    retrieve_serializer_class = serializers.DomainSerializer
    create_serializer_class = serializers.DomainSerializer
    update_serializer_class = serializers.DomainSerializer

    def get_queryset(self, *args, **kwargs):
        queryset = Domain.objects.all()
        return queryset
