from app.accounts import serializers
from app.accounts.permissions import AllowAny

from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.response import Response

from soft_drf.api import mixins
from soft_drf.api.routers.single import SingleObjectRouter
from soft_drf.api.viewsets import GenericViewSet
from soft_drf.routing.v1.routers import router

User = get_user_model()  # noqa


class ProfileViewSet(mixins.RetrieveModelMixin, GenericViewSet):
    serializer_class = serializers.UserSerializer
    retrieve_serializer_class = serializers.UserSerializer

    def get_object(self):
        return self.request.user


class SigninViewSet(mixins.CreateModelMixin, GenericViewSet):
    serializer_class = serializers.SigninSerializer
    create_serializer_class = serializers.SigninSerializer
    retrieve_serializer_class = serializers.SigninResponseSerializer
    queryset = User.objects.all()
    permission_classes = (AllowAny,)

    def get_object(self, email):
        queryset = self.get_queryset()
        return get_object_or_404(queryset, email=email)

    def create(self, request, *args, **kwargs):
        data = request.data
        serializer = self.get_serializer(data=data, action="create")

        if serializer.is_valid(raise_exception=True):
            response_serializer = self.get_serializer(
                {'email': serializer.data.get('email')},
                action="retrieve"
            )
            response_data = response_serializer.data
            del response_data['email']
            return Response(response_data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


router.register(
    r"signin",
    SigninViewSet,
    base_name="signin"
)

router.register(
    'me',
    ProfileViewSet,
    base_name='me',
    router_class=SingleObjectRouter
)
