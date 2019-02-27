"""API for datasetrows."""
from datetime import datetime

from soft_drf.api import mixins
from soft_drf.api.viewsets import GenericViewSet
from soft_drf.routing.v1.routers import router

from orax.datasetrows import serializers
from orax.datasets.models import Dataset
from orax.datasetrows.models import DatasetRow


class DatasetrowViewSet(
        mixins.ListModelMixin,
        mixins.PartialUpdateModelMixin,
        GenericViewSet):
    """Manage datasetrows endpoints."""

    serializer_class = serializers.DatasetrowSerializer
    list_serializer_class = serializers.DatasetrowSerializer
    retrieve_serializer_class = serializers.DatasetrowUpdateSerializer
    update_serializer_class = serializers.DatasetrowUpdateSerializer

    def get_queryset(self):
        """Return the universe of objects in API."""
        route = self.request.user.route
        query_params = self.request.GET.get('q', None)

        dataset = Dataset.objects.get(is_main=True)
        date = datetime.strptime('27-02-2019', '%d-%m-%Y')

        queryset = DatasetRow.objects.filter(
            is_active=True,
            route=route,
            dataset=dataset,
            date=date.date()
        )

        if query_params:
            queryset = queryset.filter(product__name__icontains=query_params)

        return queryset


router.register(
    r"datasetrows",
    DatasetrowViewSet,
    base_name="datasetrows",
)
