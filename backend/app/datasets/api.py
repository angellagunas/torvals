"""API for datasetrows."""
from io import StringIO

import boto3

import botocore

from django.contrib.auth.models import Permission
from django.core.files import File
from django.core.mail import EmailMessage
from django.db.models.expressions import RawSQL, OrderBy
from django.http import HttpResponse
from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.decorators import detail_route, list_route
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from soft_drf.api import mixins
from soft_drf.api.viewsets import GenericViewSet
from soft_drf.routing.v1.routers import router

from app.datasets import serializers
from app.datasets.models import Dataset, DatasetRow
from app.datasets.permissions import AddRowPermission
from app.datasets.utils import load_dataset
from app.projects.models import Project
from app.settings import AWS_ACCESS_ID, AWS_ACCESS_KEY, MEDIA_ROOT
from app.utils.tasks import send_slack_notifications


class DatasetViewSet(
        GenericViewSet,
        mixins.CreateModelMixin,
        mixins.PartialUpdateModelMixin):
    """Manage datasets endpoints."""

    serializer_class = serializers.DatasetSerializer
    create_serializer_class = serializers.CreateDatasetSerializer
    retrieve_serializer_class = serializers.RetrieveDatasetSerializer
    update_serializer_class = serializers.UpdateDatasetSerializer

    s3_serializer_class = serializers.DatasetSerializer
    append_serializer_class = serializers.AppendDatasetSerializer

    def partial_update(self, request, *args, **kwargs):
        """Overwrite method to update dataset."""
        if request.data.get('is_main', False):
            dataset = get_object_or_404(Dataset, id=kwargs['pk'])
            Dataset.objects.filter(
                project=dataset.project,
                is_main=True
            ).update(is_main=False)

        return super(
            DatasetViewSet, self).partial_update(request, *args, **kwargs)

    @detail_route(methods=["POST"])
    def append(self, request, *args, **kwargs):
        """Append data into existing dataset."""
        dataset_id = kwargs['pk']
        dataset = get_object_or_404(Dataset, id=dataset_id)

        append_serializer = self.get_serializer(
            data=request.data,
            action='append'
        )

        validation_response = append_serializer.is_valid(raise_exception=True)

        if not validation_response:
            return Response(
                append_serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        aws_file_name = append_serializer.data['aws_file_name']
        aws_dir = append_serializer.data['aws_dir']
        aws_bucket_name = append_serializer.data['aws_bucket_name']

        message = ('{0}/{1}/{2} was succesfully appended. \n {3} \n {4}').format(
            aws_bucket_name,
            aws_dir,
            aws_file_name,
            "dataset id: " + dataset_id,
            "dataset name: " + dataset.name
        )

        try:
            dataset.append_rows_from_s3(
                aws_file_name,
                aws_dir,
                aws_bucket_name
            )
        except botocore.exceptions.ClientError as e:
            msg = e.response['Error']['Message']
            message = (
                'An error was encountered, '
                'trying to append {0}/{1}/{2}. \n {3}{4}'
            ).format(
                aws_bucket_name,
                aws_dir,
                aws_file_name,
                "dataset id: " + dataset_id,
                "dataset name: " + dataset.name
            )
            return Response(msg, status=status.HTTP_400_BAD_REQUEST)

        send_slack_notifications.apply_async((message,))
        return Response(status=status.HTTP_200_OK)

    @list_route(methods=["POST"])
    def s3(self, request, *args, **kwargs):
        """Load dataset from s3."""
        s3_serializer = self.get_serializer(
            data=request.data,
            action='s3'
        )

        validation_response = s3_serializer.is_valid(raise_exception=True)

        if not validation_response:
            return Response(
                s3_serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        FILE_NAME = s3_serializer.data['file_name']  # noqa
        try:
            project = Project.objects.get(id=s3_serializer.data['project_id'])
        except Exception:
            return Response(
                'Project not found',
                status=status.HTTP_404_NOT_FOUND
            )

        message = (
            'The dataset given, with name: {0}, '
            'was succesfully uploaded.'
        ).format(
            FILE_NAME
        )

        try:
            s3 = boto3.resource(
                's3',
                aws_access_key_id=AWS_ACCESS_ID,
                aws_secret_access_key=AWS_ACCESS_KEY
            )
            BUCKET_NAME = project.bucket_name  # noqa

            S3_DIR = project.bucket_folder  # noqa
            S3_FILE_NAME = '{0}/{1}'.format(S3_DIR, FILE_NAME)  # noqa

            TARGET_PATH = '{0}/s3/{1}'.format(  # noqa
                MEDIA_ROOT,
                FILE_NAME
            )

            s3.Bucket(BUCKET_NAME).download_file(S3_FILE_NAME, TARGET_PATH)

            #
            # Create dataset and load data
            #

            Dataset.objects.filter(
                is_main=True,
                project=project
            ).update(is_main=False)

            file_s3 = open(TARGET_PATH)

            dataset = Dataset(
                name=S3_FILE_NAME,
                description=S3_FILE_NAME + 'cargado desde S3',
                is_main=True,
                project=project,
                file=File(file_s3),
                date_adjustment=s3_serializer.data['date_adjustment']
            )
            dataset.save()
            load_dataset(dataset)

        except botocore.exceptions.ClientError as e:
            msg = e.response['Error']['Message']
            message = (
                'An error was encontered '
                'trying to upload the dataset to aws service. '
                'Dataset name: {0}'
            ).format(
                FILE_NAME
            )
            return Response(msg, status=status.HTTP_400_BAD_REQUEST)

        send_slack_notifications.apply_async((message,))
        return Response(status=status.HTTP_200_OK)

    def get_queryset(self):
        """Universe of datasets."""
        return Dataset.objects.all()


class DatasetrowViewSet(
        mixins.ListModelMixin,
        mixins.PartialUpdateModelMixin,
        mixins.CreateModelMixin,
        GenericViewSet):
    """Manage datasetrows endpoints."""

    permission_classes = [AddRowPermission, IsAuthenticated]
    scape_camel_case_parser = ['create']
    serializer_class = serializers.DatasetrowSerializer
    list_serializer_class = serializers.DatasetrowSerializer
    retrieve_serializer_class = serializers.DatasetrowUpdateSerializer
    update_serializer_class = serializers.DatasetrowUpdateSerializer
    create_serializer_class = serializers.DatasetRowCreateSerializer

    def get_queryset(self):
        """Return the universe of objects in API."""
        sales_centers = self.request.user.sale_center.all()
        query_params = self.request.GET.get('sortBy', None)

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
            queryset = queryset.order_by(OrderBy(
                RawSQL("cast(extra_columns->>%s as float)", (query_params,)),
                descending=True)
            )
        return queryset

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
        try:
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

            query_params = list(self.request.GET.values())
            filters = {
                'sale_center__in': sales_centers,
                'is_active': True
            }
            dataset.to_web_csv(csv_file, filters, query_params)

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
            p = Permission.objects.get(codename="can_send_email")
            user.user_permissions.remove(p)

            user.save()
            send_slack_notifications.apply_async(("Email Sent: \n from: {0} \n to: {1}".format(
                self.request.user,
                self.request.user.admin_emails),
            ))
        except Exception as e:
            send_slack_notifications.apply_async(
                ("Error: {0} \n trying to send an email \n from: {1} \n to: {2}".format(
                    e,
                    self.request.user,
                    self.request.user.admin_emails),
                 )
            )

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

        query_params = list(self.request.GET.values())

        filters = {
            'sale_center__in': sales_centers,
            'is_active': True
        }
        dataset.to_web_csv(response, filters, query_params)

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

router.register(
    r"datasets",
    DatasetViewSet,
    base_name="datasets",
)
