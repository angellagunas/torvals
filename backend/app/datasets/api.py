"""API for datasetrows."""
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

from app.datasets import serializers
from app.datasets.models import Dataset, DatasetRow


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
        sales_centers = self.request.user.sale_center.all()
        query_params = self.request.GET.get('q', None)

        dataset = Dataset.objects.get(
            is_main=True,
            project=self.request.user.project
        )

        queryset = DatasetRow.objects.filter(
            is_active=True,
            sale_center__in=sales_centers,
            dataset=dataset
        )

        if query_params:
            queryset = queryset.filter(
                Q(product__name__icontains=query_params) |
                Q(product__external_id__icontains=query_params)
            )
        return queryset.order_by('-product__name')

    def partial_update(self, request, *args, **kwargs):
        """Overwrite method to save datasetrow."""
        row = DatasetRow.objects.get(id=kwargs.get('pk'))

        for request_key in request.data:
            for column_name in row.extra_columns:
                if request_key == column_name:
                    row.extra_columns[request_key] = request.data[request_key]

        row.save()

        return Response(row.extra_columns)

    @list_route(methods=["GET"])
    def send(self, request, *args, **kwargs):
        """Send the adjustment report of user in session."""
        csv_file = StringIO()

        project = self.request.user.project
        dataset = Dataset.objects.get(
            is_main=True,
            project=project
        )

        sales_centers = self.request.user.sale_center.all()
        date_adjustment_label = dataset.date_adjustment
        str_date = date_adjustment_label.strftime('%d/%m/%Y')
        str_date = str_date.replace('/', '_de_', 1)
        str_date = str_date.replace('/', '_del_')

        dataset.to_web_csv(csv_file, filters={
            'sale_center__in': sales_centers,
            'is_active': True
        })

        receivers = set(
            self.request.user.admin_emails + [self.request.user.email]
        )

        ceves_id = '_'.join([sc.external_id for sc in sales_centers])
        ceves_name = '_'.join([sc.name for sc in sales_centers])
        subject = "Pedido sugerido - {0} - {1}".format(
            ceves_name,
            ceves_id
        )
        msg = EmailMessage(
            subject,
            subject,
            'contact@abraxasintelligence.com',
            receivers
        )

        file_name = 'adjustment_report_ceve_{0}_{1}.csv'.format(
            ceves_id,
            str_date
        )

        msg.content_subtype = "html"
        msg.attach(
            file_name,
            csv_file.getvalue(),
            'text/csv'
        )
        msg.send()

        user = self.request.user
        user.can_edit = False
        user.save()

        return Response(status=status.HTTP_200_OK)

    @list_route(methods=["GET"])
    def download(self, request, *args, **kwargs):
        """Download current dataset."""
        dataset = Dataset.objects.get(
            is_main=True,
            project=request.user.project
        )

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename={}.csv'.format(
            dataset.name + '_adjustements'
        )

        sales_centers = self.request.user.sale_center.all()

        dataset.to_web_csv(response, filters={
            'sale_center__in': sales_centers,
            'is_active': True
        })

        return response

    @list_route(methods=["GET"])
    def indicators(self, request, *args, **kwargs):
        """Return the sum of indicators."""
        result = {}

        result['total_transit'] = 0
        result['total_stock'] = 0
        result['total_safetyStock'] = 0
        result['total_adjustment'] = 0
        result['transit_money'] = 0
        result['exists_money'] = 0
        result['safety_stock_money'] = 0
        result['adjustment_money'] = 0

        return Response(result)


router.register(
    r"datasetrows",
    DatasetrowViewSet,
    base_name="datasetrows",
)