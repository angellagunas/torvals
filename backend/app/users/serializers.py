"""Serializer for Dataset rows API."""
from rest_framework import serializers

from app.projects.serializers import ProjectSerializer
from app.sales_centers.serializers import SaleCenterSerializer
from app.users.models import User
from app.utils.tokens import create_token


class UserProfileSerializer(serializers.ModelSerializer):
    """Profile serializer."""

    sale_center = SaleCenterSerializer(many=True)
    project = ProjectSerializer()

    class Meta:
        """Define behaivor."""

        model = User
        fields = [
            'id',
            'email',
            'sale_center',
            'project',
            'can_edit'
        ]


class AuthSerializer(serializers.Serializer):
    """Serializer for Auth API when POST method is used."""

    email = serializers.CharField(
        required=True
    )

    password = serializers.CharField(
        required=True
    )

    def validate(self, data):
        """Validation username, password and active status."""
        try:
            user = User.objects.get(email__exact=data.get('email'))
        except User.DoesNotExist:
            raise serializers.ValidationError("credentials are not valid")

        if not user.check_password(data.get('password')):
            raise serializers.ValidationError("credentials are not valid")

        if not user.is_active:
            raise serializers.ValidationError(
                'the user has not been activated'
            )

        return data


class AuthResponseSerializer(serializers.ModelSerializer):
    """Serializer for Auth API when GET method is used."""

    token = serializers.SerializerMethodField()
    sale_center = SaleCenterSerializer(many=True)
    project = ProjectSerializer()

    class Meta:
        """Define the behavior of Serializer."""

        model = User
        fields = [
            'token',
            'email',
            'sale_center',
            'project'
        ]

    def get_token(self, obj):
        """Create token."""
        return create_token(obj)
