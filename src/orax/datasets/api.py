from rest_framework.exceptions import NotFound

from soft_drf.api import mixins
from soft_drf.api.viewsets import GenericViewSet
from soft_drf.routing.v1.routers import router

from orax.datasets.serializers import graph
from orax.utils.connections import Mongo


class DatasetGraphViewSet(mixins.CreateModelMixin, GenericViewSet):

    serializer_class = graph.DatasetGraphSerializer
    retrieve_serializer_class = graph.DatasetGraphSerializer
    create_serializer_class = graph.DatasetGraphSerializer
    queryset = []

    def create(self, request, *args, **kwargs):
        self._validate(request, *args, **kwargs)
        return super(DatasetGraphViewSet, self).create(request, *args, **kwargs)

    def _validate(self, request, *args, **kwargs):
        dataset = Mongo().datasets.find_one({
            'uuid': kwargs.get('uuid'),
            'isDeleted': False
        })

        if dataset is None:
            raise NotFound()


router.register(
    r"datasets/sales/(?P<uuid>[0-9A-Fa-f-]+)",
    DatasetGraphViewSet,
    base_name="datasets/graph",
)