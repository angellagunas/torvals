"""Serializer for Dataset rows API."""
from django.shortcuts import get_object_or_404

from rest_framework import serializers

from app.datasets.models import Dataset, DatasetRow, DatasetType
from app.products.models import Product
from app.products.serializers import ProductSerializer
from app.projects.serializers import ProjectSerializer
from app.sales_centers.models import SaleCenter
from app.sales_centers.serializers import SaleCenterSerializer


class CreateDatasetSerializer(serializers.ModelSerializer):
    """Serializer to create Dataset."""

    class Meta:
        """Define class behavior."""

        model = Dataset
        fields = [
            'name',
            'description',
            'date_adjustment',
            'project'
        ]

    def create(self, validated_data):
        """Overwrite method create."""
        user = self.context['request'].user

        dataset_type = DatasetType.objects.filter(
            project=user.project,
            slug='pedidos'
        )[0]

        validated_data['is_main'] = False
        validated_data['type'] = dataset_type
        return Dataset.objects.create(**validated_data)


class AppendDatasetSerializer(serializers.Serializer):
    """Serialize data to append new data in existing dataset."""

    aws_file_name = serializers.CharField(max_length=500)
    aws_dir = serializers.CharField(max_length=500)
    aws_bucket_name = serializers.CharField(max_length=500)


class UpdateDatasetSerializer(serializers.ModelSerializer):
    """Serialize data for dataset update."""

    class Meta:
        """Define class behavior."""

        model = Dataset
        fields = ['is_main']


class RetrieveDatasetSerializer(serializers.ModelSerializer):
    """Serialize data for dataset update."""

    class Meta:
        """Define class behavior."""

        model = Dataset
        fields = [
            'id',
            'name',
            'description',
            'date_adjustment',
            'is_main'
        ]


class DatasetSerializer(serializers.Serializer):
    """Seriaize data from s3."""

    file_name = serializers.CharField(max_length=255)
    project_id = serializers.IntegerField(min_value=1)
    date_adjustment = serializers.DateField()


class DatasetrowSerializer(serializers.ModelSerializer):
    """Serializer for Datasetrows API when GET method is used."""

    product = ProductSerializer()
    sale_center = SaleCenterSerializer()

    class Meta:
        """Define the behavior of Serializer."""

        model = DatasetRow
        fields = [
            'id',
            'product',
            'sale_center',
            'date',
            'extra_columns',
            'is_extraordinary'
        ]


class DatasetrowUpdateSerializer(serializers.ModelSerializer):
    """Serializer for Datasetrows API when PATCH method is used."""

    class Meta:
        """Define the behavior of Serializer."""

        model = DatasetRow
        fields = '__all__'


class DatasetRowCreateSerializer(serializers.Serializer):
    """""Serializer for Datasetrows API when create method is used """

    extra_columns = serializers.DictField()

    def create(self, data):
        query_params = self.context['request'].GET
        dataset_type = query_params.get('dataset_type', 'pedidos')
        product_id = query_params.get('product_id', None)
        sale_center_id = query_params.get('sale_center_id', None)
        product = None
        sale_center = None

        if product_id:
            product, created = Product.objects.get_or_create(
                quota=0,
                bed=0,
                pallet=0,
                external_id=product_id,
                name=query_params.get('product_name', 'N/A'),
                project=self.context['request'].user.project
            )

        dataset = Dataset.objects.filter(
            project=self.context['request'].user.project,
            is_active=True,
            is_main=True,
            type__slug=dataset_type).last()

        date = query_params.get('date', dataset.date_adjustment)

        if sale_center_id:
            sale_center = get_object_or_404(
                SaleCenter,
                external_id=sale_center_id,
                project=self.context['request'].user.project,
                is_active=True
            )

        row = {
            'dataset': dataset,
            'date': date,
            'extra_columns': data['extra_columns']
        }
        if product:
            row['product'] = product

        if sale_center:
            row['sale_center'] = sale_center

        new_row = DatasetRow.objects.create(**row)

        return new_row


class DatasetTypeSerializer(serializers.ModelSerializer):
    project = ProjectSerializer()

    class Meta:
        model = DatasetType
        fields = [
            'id',
            'name',
            'slug',
            'project'
        ]
