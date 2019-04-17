"""Serializer for Dataset rows API."""
from django.shortcuts import get_object_or_404

from rest_framework import serializers

from app.datasets.models import Dataset, DatasetRow
from app.products.models import Product
from app.products.serializers import ProductSerializer
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
        validated_data['is_main'] = False
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
    product_id = serializers.CharField(
        max_length=200,
        min_length=1,
        required=True
    )

    product_name = serializers.CharField(
        max_length=200,
        min_length=1,
        required=True
    )
    pedido = serializers.IntegerField(
        min_value=0,
        required=True
    )
    sale_center = serializers.CharField(
        max_length=200,
        min_length=1,
        required=True
    )

    def create(self, data):
        product, created = Product.objects.get_or_create(
            quota=0,
            bed=0,
            pallet=0,
            external_id=data.get('product_id'),
            name=data.get('product_name'),
            project=self.context['request'].user.project
        )

        dataset = Dataset.objects.filter(
            project=self.context['request'].user.project,
            is_active=True).last()

        sale_center = get_object_or_404(
            SaleCenter, external_id=data.get('sale_center'),
            project=self.context['request'].user.project,
            is_active=True
        )

        temp_datasetRow = DatasetRow.objects.filter(
            dataset=dataset
        )[0]

        temp_extra_columns = temp_datasetRow.extra_columns

        for column in temp_extra_columns:
            temp_extra_columns[column] = 0

        temp_extra_columns['pedido_final'] = data.get('pedido')

        datasetRow = DatasetRow.objects.create(
            product=product,
            dataset=dataset,
            sale_center=sale_center,
            date=dataset.date_adjustment,
            extra_columns=temp_extra_columns,
            is_extraordinary=True
        )
        return datasetRow
