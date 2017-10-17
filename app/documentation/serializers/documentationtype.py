# -*- coding: utf-8 -*-
from app.documentation.models import DocumentationType

from soft_drf.api.serializers import ModelSerializer


class DocumentationTypeSerializer(ModelSerializer):

    class Meta:
        model = DocumentationType
        fields = (
            'id',
            'name',
        )
