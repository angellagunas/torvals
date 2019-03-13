"""API for datasetrows."""
import csv
import math

from django.db.models import Q
from django.http import HttpResponse
from soft_drf.api import mixins
from soft_drf.api.viewsets import GenericViewSet
from soft_drf.routing.v1.routers import router


from orax.datasets import serializers
from orax.datasets.models import Dataset, DatasetRow
from orax.users.models import User


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
        sale_center = self.request.user.sale_center
        query_params = self.request.GET.get('q', None)

        dataset = Dataset.objects.get(is_main=True)

        queryset = DatasetRow.objects.filter(
            is_active=True,
            sale_center=sale_center,
            dataset=dataset,
            date=dataset.date_adjustment
        )

        if query_params:
            queryset = queryset.filter(
                Q(product__name__icontains=query_params) |
                Q(product__external_id__icontains=query_params)
            )
        print('Entro')
        return queryset.order_by('-prediction')


class DatasetDownloadViewSet(mixins.ListModelMixin, GenericViewSet):

    def list(self, request, *args, **kwargs):
        """Download current dataset"""
        dataset = Dataset.objects.get(is_main=True)
        columns = [
            'Producto',
            'Sugerido',
            'Ajuste',
            'Corrugados',
            '% Ajustado',
            'Cupos',
            'Dev. Prom',
            'Vta. Prom'
        ]

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename={}.csv'.format(
            dataset.name + '_adjustements'
        )
        writer = csv.writer(response)
        writer.writerow(columns)

        sale_center = User.objects.get(name=request.user).sale_center

        rows = DatasetRow.objects.filter(
            dataset_id=dataset.id,
            date=dataset.date_adjustment,
            sale_center=sale_center
        )

        for row in rows:
            # product_id = row.product.external_id
            product_name = row.product.name
            prediction = row.prediction
            adjustment = row.adjustment
            corrugados = math.round(row.adjustment / row.product.quota)
            percent_adjustment = ((adjustment - prediction) / prediction) * 100
            quota = row.product.quota
            dev_prom = 1
            vta_prom = 1
            # sale_center_id = row.sale_center.external_id
            # date = row.date
            # suggested = row.prediction
            # adjustment = row.adjustment

            row = writer.writerow([
                product_name,
                prediction,
                adjustment,
                corrugados,
                percent_adjustment,
                quota,
                dev_prom,
                vta_prom
            ])

        return response


router.register(
    r"datasetrows",
    DatasetrowViewSet,
    base_name="datasetrows",
)

router.register(
    r"datasetrows",
    DatasetDownloadViewSet,
    base_name="datasetrows",
)
