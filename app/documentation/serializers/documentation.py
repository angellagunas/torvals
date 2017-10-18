# -*- coding: utf-8 -*-
from app.accounts.serializers import UserSerializer
from app.documentation.models import Documentation
from app.documentation.serializers.answer import AnswerSerializer

from soft_drf.api.serializers import ModelSerializer

from .documentationtype import DocumentationTypeSerializer


class DocumentationSerializer(ModelSerializer):
    type = DocumentationTypeSerializer()
    author = UserSerializer()
    answers = AnswerSerializer(many=True)

    class Meta:
        model = Documentation
        fields = (
            'id',
            'title',
            'body',
            'type',
            'author',
            'answers',
        )
