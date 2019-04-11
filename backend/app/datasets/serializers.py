"""Serializer for Dataset rows API."""
from rest_framework import serializers

from app.datasets.models import Dataset, DatasetRow
from app.products.serializers import ProductSerializer
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
            'extra_columns'
        ]


class DatasetrowUpdateSerializer(serializers.ModelSerializer):
    """Serializer for Datasetrows API when PATCH method is used."""

    class Meta:
        """Define the behavior of Serializer."""

        model = DatasetRow
        fields = '__all__'
