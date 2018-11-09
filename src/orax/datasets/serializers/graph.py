import json

from rest_framework import serializers

from bson.objectid import ObjectId
from bson.json_util import dumps

from orax.utils.connections import Mongo
from orax.datasets import DatasetUtils



class DatasetGraphRetrieveSerializer(serializers.Serializer):
    def validate(self, data):
        return data


class DatasetGraphSerializer(serializers.Serializer):
    cycle = serializers.CharField()
    centro_de_venta = serializers.CharField()
    canal = serializers.CharField()
    prices = serializers.BooleanField(default=False)

    def validate(self, data):
        request = self.context.get('request')
        organization = request.user.get_current_org(request)
        #
        # validar que los acatalog items que manda el usuario esten en sus
        # grupos
        #
        return data

    def create(self, data):
        kwargs = self.context.get('view').kwargs
        indicators = DatasetUtils.get_indicators(
            dataset_uuid=kwargs.get('uuid'),
            cycle_uuid=data.get('cycle'),
            channel_uuid=data.get('canal'),
            sale_center_uuid=data.get('centro_de_venta'),
            prices=data.get('prices')
        )

        return indicators