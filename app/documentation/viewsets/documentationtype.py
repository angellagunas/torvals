# -*- coding: utf-8 -*-
from app.documentation.models import DocumentationType
from app.documentation.serializers import documentationtype as serializers

from soft_drf.api import mixins
from soft_drf.api.viewsets import GenericViewSet


class DocumentationTypeViewSet(
    GenericViewSet,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.PartialUpdateModelMixin,
    mixins.DestroyModelMixin,
):
    serializer_class = serializers.DocumentationTypeSerializer
    list_serializer_class = serializers.DocumentationTypeSerializer
    retrieve_serializer_class = serializers.DocumentationTypeSerializer
    create_serializer_class = serializers.DocumentationTypeSerializer
    update_serializer_class = serializers.DocumentationTypeSerializer

    def get_queryset(self, *args, **kwargs):
        queryset = DocumentationType.objects.all()
        return queryset
