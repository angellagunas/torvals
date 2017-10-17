# -*- coding: utf-8 -*-
from django.contrib.auth import get_user_model

from rest_framework import serializers

from soft_drf.auth.utilities import create_token

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'email',
            'username'
        ]


class SigninSerializer(serializers.Serializer):
    email = serializers.CharField(required=True)
    password = serializers.CharField(required=True)

    class Meta:
        model = User
        fields = [
            'email',
            'password'
        ]

    def validate(self, data):
        try:
            user = User.objects.get(email__exact=data.get('email'))
        except User.DoesNotExist:
            raise serializers.ValidationError('credentials are not valid')

        if not user.check_password(data.get('password')):
            raise serializers.ValidationError('credentials are not valid')

        return data


class SigninResponseSerializer(serializers.Serializer):
    token = serializers.SerializerMethodField()
    email = serializers.EmailField()

    class Meta:
        fields = [
            'token',
            'email'
        ]

    def get_token(self, instance):
        user = User.objects.get(email=instance.get('email'))
        return create_token(user)
