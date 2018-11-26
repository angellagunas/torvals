from rest_framework import status
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.response import Response

from soft_drf.api import mixins
from soft_drf.api.viewsets import GenericViewSet
from soft_drf.routing.v1.routers import router

from orax.datasets.serializers import graph
from orax.utils.connections import Mongo
from orax.utils.cache import Cache


class DatasetGraphViewSet(mixins.CreateModelMixin, GenericViewSet):

    serializer_class = graph.DatasetGraphSerializer
    retrieve_serializer_class = graph.DatasetGraphRetrieveSerializer
    create_serializer_class = graph.DatasetGraphSerializer
    queryset = []

    def create(self, request, *args, **kwargs):
        self._validate(request, *args, **kwargs)

        key_cache = str(Cache.get_key_from_request(request, *args, **kwargs))

        if(Cache.exists(key_cache)):
            return Response(Cache.get(key_cache))

        data = request.data
        data['centro_de_venta'] = data['centro-de-venta']
        del data['centro-de-venta']

        create_serializer = self.get_serializer(
            data=data,
            action='create'
        )
        create_serializer.is_valid(raise_exception=True)

        try:
            data = create_serializer.save()
            Cache.set(key_cache, data)

            return Response(data)
        except Exception as e:
            print(e)
            return Response({})

    def _validate(self, request, *args, **kwargs):
        dataset = Mongo().datasets.find_one({
            'uuid': kwargs.get('uuid'),
            'isDeleted': False
        })

        if dataset is None:
            raise NotFound()

        if 'centro-de-venta' not in request.data:
            raise ValidationError({'centro-de-venta': ['This field is required.']})


router.register(
    r"datasets/sales/(?P<uuid>[0-9A-Fa-f-]+)",
    DatasetGraphViewSet,
    base_name="datasets/graph",
)
