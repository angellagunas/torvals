# -*- coding: utf-8 -*-
from app.documentation.models import Answer

from soft_drf.api.serializers import ModelSerializer


class AnswerSerializer(ModelSerializer):

    class Meta:
        model = Answer
        fields = (
            'id',
            'body',
            'author',
        )
