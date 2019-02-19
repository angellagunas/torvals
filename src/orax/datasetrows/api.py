"""API for datasetrows."""
from soft_drf.api import mixins
from soft_drf.api.viewsets import GenericViewSet
from soft_drf.routing.v1.routers import router

from orax.datasetrows import serializers
from orax.datasetrows.models import DatasetRow


class DatasetrowViewSet(
        mixins.ListModelMixin,
        mixins.PartialUpdateModelMixin,
        GenericViewSet):
    """Manage datasetrows endpoints."""

    permission_classes = []
    serializer_class = serializers.DatasetrowSerializer
    list_serializer_class = serializers.DatasetrowSerializer
    update_serializer_class = serializers.DatasetrowUpdateSerializer

    def get_queryset(self):
        """Return the universe of objects in API."""
        return DatasetRow.objects.all()


router.register(
    r"datasetrows",
    DatasetrowViewSet,
    base_name="datasetrows",
)
