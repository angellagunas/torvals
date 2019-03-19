"""API for datasetrows."""
import csv
from io import StringIO

from django.core.mail import EmailMessage
from django.db.models import Q
from django.http import HttpResponse


from rest_framework import status
from rest_framework.decorators import list_route
from rest_framework.response import Response

from soft_drf.api import mixins
from soft_drf.api.viewsets import GenericViewSet
from soft_drf.routing.v1.routers import router

from orax import settings
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
        sale_center = self.request.user.sale_center
        query_params = self.request.GET.get('q', None)

        dataset = Dataset.objects.get(is_main=True)

        queryset = DatasetRow.objects.filter(
            is_active=True,
            sale_center=sale_center,
            dataset=dataset
        )

        if query_params:
            queryset = queryset.filter(
                Q(product__name__icontains=query_params) |
                Q(product__external_id__icontains=query_params)
            )
        return queryset.order_by('-prediction')

    @list_route(methods=["GET"])
    def send(self, request, *args, **kwargs):
        """Send the adjustment report of user in session."""
        csv_file = StringIO()

        fieldnames = [
            'fecha_de_venta',
            'CEVE',
            'item',
            'producto',
            'transitos',
            'existencia',
            'safety_stock',
            'sugerido',
            'pedido_final',
            'pedido_final_camas',
            'pedido_final_tarimas'
        ]

        writer = csv.writer(csv_file)
        writer.writerow(fieldnames)

        dataset = Dataset.objects.get(is_main=True)
        sale_center = self.request.user.sale_center
        sale_center_id = self.request.user.sale_center.external_id

        date_adjustment_label = dataset.date_adjustment
        str_date = date_adjustment_label.strftime('%d/%m/%Y')
        str_date = str_date.replace('/', '_de_', 1)
        str_date = str_date.replace('/', '_del_')

        email_to = self.request.user.email

        rows = DatasetRow.objects.filter(
            dataset_id=dataset.id,
            sale_center=sale_center,
            is_active=True
        )

        for row in rows:
            date = row.date
            sale_center_id = row.sale_center.external_id
            item = row.product.external_id
            product = row.product.name
            transits = row.transit
            stocks = row.in_stock
            safety_stock = row.safety_stock
            prediction = row.prediction
            adjustment = row.adjustment
            beds = row.bed
            pallets = row.pallet

            row = writer.writerow([
                date,
                sale_center_id,
                item,
                product,
                transits,
                stocks,
                safety_stock,
                prediction,
                adjustment,
                beds,
                pallets
            ])
            msg = EmailMessage(
                'Reporte Diario',
                'Reporte de Ajustes',
                settings.EMAIL_HOST_USER,
                [email_to]
            )
            msg.content_subtype = "html"
            file_name = 'adjustment_report_ceve_' + \
                str(sale_center_id) + '_' + str_date + '.csv'

            msg.attach(file_name,
                       csv_file.getvalue(), 'text/csv')
            msg.send()

        return Response(status=status.HTTP_200_OK)

    @list_route(methods=["GET"])
    def download(self, request, *args, **kwargs):
        """Download current dataset."""
        dataset = Dataset.objects.get(is_main=True)
        columns = [
            'fecha_de_venta',
            'CEVE',
            'item',
            'producto',
            'transitos',
            'existencia',
            'safety_stock',
            'sugerido',
            'pedido_final',
            'pedido_final_camas',
            'pedido_final_tarimas'
        ]

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename={}.csv'.format(
            dataset.name + '_adjustements'
        )
        writer = csv.writer(response)
        writer.writerow(columns)

        sale_center = self.request.user.sale_center

        rows = DatasetRow.objects.filter(
            dataset_id=dataset.id,
            sale_center=sale_center,
            is_active=True
        )

        for row in rows:
            date = row.date
            sale_center_id = row.sale_center.external_id
            item = row.product.external_id
            product = row.product.name
            transits = row.transit
            stocks = row.in_stock
            safety_stock = row.safety_stock
            prediction = row.prediction
            adjustment = row.adjustment
            beds = row.bed
            pallets = row.pallet

            row = writer.writerow([
                date,
                sale_center_id,
                item,
                product,
                transits,
                stocks,
                safety_stock,
                prediction,
                adjustment,
                beds,
                pallets
            ])

        return response


router.register(
    r"datasetrows",
    DatasetrowViewSet,
    base_name="datasetrows",
)
