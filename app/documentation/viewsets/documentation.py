# -*- coding: utf-8 -*-
from app.documentation.models import Documentation
from app.documentation.serializers import documentation as serializers

from soft_drf.api import mixins
from soft_drf.api.viewsets import GenericViewSet


class DocumentationViewSet(
    GenericViewSet,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.PartialUpdateModelMixin,
    mixins.DestroyModelMixin,
):
    serializer_class = serializers.DocumentationSerializer
    list_serializer_class = serializers.DocumentationSerializer
    retrieve_serializer_class = serializers.DocumentationSerializer
    create_serializer_class = serializers.DocumentationSerializer
    update_serializer_class = serializers.DocumentationSerializer

    def get_queryset(self, *args, **kwargs):
        queryset = Documentation.objects.all()
        return queryset
