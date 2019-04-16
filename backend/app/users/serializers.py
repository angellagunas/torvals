"""Serializer for Dataset rows API."""
from django.contrib.auth.models import Group, Permission


from rest_framework import serializers

from app.projects.serializers import ProjectSerializer
from app.sales_centers.serializers import SaleCenterSerializer
from app.users.models import User
from app.utils.tokens import create_token


class UserPermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = '__all__'


class GroupPermissionSerializer(serializers.ModelSerializer):
    permissions = UserPermissionSerializer(many=True)

    class Meta:
        model = Group
        fields = '__all__'


class UserProfileSerializer(serializers.ModelSerializer):
    """Profile serializer."""

    sale_center = SaleCenterSerializer(many=True)
    project = ProjectSerializer()
    user_permissions = UserPermissionSerializer(many=True)
    groups = GroupPermissionSerializer(many=True)

    class Meta:
        """Define behaivor."""

        model = User
        fields = [
            'id',
            'email',
            'sale_center',
            'project',
            'can_edit',
            'user_permissions',
            'groups'
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
                'The user has not been activated'
            )

        if not user.project:
            raise serializers.ValidationError(
                'The user does not have any project assigned.',
                code=401
            )

        if not user.sale_center.count():
            raise serializers.ValidationError(
                'The user does not have any sales center assigned.',
                code=401
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
