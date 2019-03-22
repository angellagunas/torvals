"""User API."""
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from soft_drf.api import mixins
from soft_drf.api.viewsets import GenericViewSet
from soft_drf.api.routers.single import SingleObjectRouter
from soft_drf.routing.v1.routers import router

from orax.users import serializers

# User model
User = get_user_model()


class ProfileViewSet(mixins.RetrieveModelMixin, GenericViewSet):
    """Manage the Authentication process."""

    serializer_class = serializers.UserProfileSerializer
    retrieve_serializer_class = serializers.UserProfileSerializer

    def get_object(self):
        """Return the user in session."""
        return self.request.user

    def retrieve(self, request, *args, **kwargs):
        """Get data for user profile."""
        return super(ProfileViewSet, self).retrieve(request, *args, **kwargs)


class AuthViewSet(GenericViewSet):
    """Manage the Authentication process."""

    serializer_class = serializers.AuthSerializer
    create_serializer_class = serializers.AuthSerializer
    retrieve_serializer_class = serializers.AuthResponseSerializer

    queryset = User.objects.all()

    permission_classes = [AllowAny]

    def get_object(self, email):
        """Return the user with given email."""
        queryset = self.get_queryset()
        return get_object_or_404(queryset, email=email)

    def create(self, request, *args, **kwargs):
        """User login with local credentials."""
        login_serializer = self.get_serializer(
            data=request.data,
            action='create'
        )

        validation_response = login_serializer.is_valid(raise_exception=True)

        if validation_response:
            user = self.get_object(login_serializer.data['email'])

            response_serializer = self.get_serializer(
                user,
                action='retrieve'
            )

            return Response(response_serializer.data)
        return Response(
            login_serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


router.register(
    r'auth',
    AuthViewSet,
    base_name="auth",
)

router.register(
    r'me',
    ProfileViewSet,
    base_name="user_me",
    router_class=SingleObjectRouter
)
