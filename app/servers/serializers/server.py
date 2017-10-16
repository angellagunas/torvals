# -*- coding: utf-8 -*-
from app.apps.models import App, Port
from app.apps.serializers.app import AppSerializer
from app.apps.serializers.port import PortSerializer
from app.domains.models import Domain
from app.domains.serializers.domain import DomainSerializer
from app.servers.models import Environment, Server
from app.servers.serializers.environment import EnvironmentSerializer


from rest_framework import serializers

from soft_drf.api.serializers import ModelSerializer


class ServerSerializer(ModelSerializer):
    ports = serializers.SerializerMethodField()
    programs = serializers.SerializerMethodField()
    envs = serializers.SerializerMethodField()
    domains = serializers.SerializerMethodField()

    class Meta:
        model = Server
        fields = (
            'id',
            'name',
            'ip_v4',
            'ip_v6',
            'ports',
            'programs',
            'envs',
            'domains'
        )

    def get_ports(self, instance):
        return PortSerializer(Port.objects.all(), many=True).data

    def get_programs(self, instance):
        return AppSerializer(App.objects.all(), many=True).data

    def get_envs(self, instance):
        return EnvironmentSerializer(Environment.objects.all(), many=True).data

    def get_domains(self, instance):
        return DomainSerializer(Domain.objects.all(), many=True).data
