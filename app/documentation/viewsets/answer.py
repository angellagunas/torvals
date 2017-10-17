# -*- coding: utf-8 -*-
from app.documentation.models import Answer
from app.documentation.serializers import answer as serializers

from soft_drf.api import mixins
from soft_drf.api.viewsets import GenericViewSet


class AnswerViewSet(
    GenericViewSet,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.PartialUpdateModelMixin,
    mixins.DestroyModelMixin,
):
    serializer_class = serializers.AnswerSerializer
    list_serializer_class = serializers.AnswerSerializer
    retrieve_serializer_class = serializers.AnswerSerializer
    create_serializer_class = serializers.AnswerSerializer
    update_serializer_class = serializers.AnswerSerializer

    permission_classes = []  # put your custom permissions here

    def get_queryset(self, *args, **kwargs):
        queryset = Answer.objects.all()
        return queryset
