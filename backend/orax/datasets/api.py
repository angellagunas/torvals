"""API for datasetrows."""
from django.db.models import Q

from soft_drf.api import mixins
from soft_drf.api.viewsets import GenericViewSet
from soft_drf.routing.v1.routers import router

from orax.datasets import serializers
from orax.datasets.models import Dataset, DatasetRow


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
        agency = self.request.user.agency
        query_params = self.request.GET.get('q', None)

        dataset = Dataset.objects.get(is_main=True)

        queryset = DatasetRow.objects.filter(
            is_active=True,
            route=route,
            sale_center=agency,
            dataset=dataset,
            date=dataset.date_adjustment
        )

        if query_params:
            queryset = queryset.filter(
                Q(product__name__icontains=query_params) |
                Q(product__external_id__icontains=query_params)
            )

        return queryset.order_by('-prediction')


router.register(
    r"datasetrows",
    DatasetrowViewSet,
    base_name="datasetrows",
)
