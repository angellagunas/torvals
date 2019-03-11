"""
Provides various authentication policies.
"""
from django.contrib.auth import get_user_model
from django.utils.encoding import smart_text

import jwt

from rest_framework import exceptions
from rest_framework.authentication import (
    BaseAuthentication, get_authorization_header
)
from rest_framework_jwt.settings import api_settings

from orax.users.models import User


#
# JWT AUTHENTICATION
#
class BaseJSONWebTokenAuthentication(BaseAuthentication):
    """
    Token based authentication using the JSON Web Token standard.
    """
    def authenticate(self, request):
        """
        Returns a two-tuple of `User` and token if a valid signature has been
        supplied using JWT-based authentication.  Otherwise returns `None`.
        """
        jwt_value = self.get_jwt_value(request)
        if jwt_value is None:
            return None

        user = self.authenticate_credentials(jwt_value)

        return (user, jwt_value)

    def authenticate_credentials(self, token):
        """
        Returns an active user that matches the payload's user id and email.
        """
        try:
            unverified_payload = jwt.decode(token, None, False)
            user = User.objects.get(email=unverified_payload['email'])
        except Exception as e:
            print(e)
            raise exceptions.AuthenticationFailed('Invalid signature.')

        return user


class JSONWebTokenAuthentication(BaseJSONWebTokenAuthentication):
    """
    Clients should authenticate by passing the token key in the "Authorization"
    HTTP header, prepended with the string specified in the setting
    `JWT_AUTH_HEADER_PREFIX`. For example:
        Authorization: JWT eyJhbGciOiAiSFMyNTYiLCAidHlwIj
    """
    www_authenticate_realm = 'api'

    def get_jwt_value(self, request):
        auth = get_authorization_header(request).split()
        auth_header_prefix = 'bearer'

        if not auth:
            if api_settings.JWT_AUTH_COOKIE:
                return request.COOKIES.get(api_settings.JWT_AUTH_COOKIE)
            return None

        if smart_text(auth[0].lower()) != auth_header_prefix:
            return None

        if len(auth) == 1:
            msg = _('Invalid Authorization header. No credentials provided.')
            raise exceptions.AuthenticationFailed(msg)
        elif len(auth) > 2:
            msg = _('Invalid Authorization header. Credentials string '
                    'should not contain spaces.')
            raise exceptions.AuthenticationFailed(msg)

        return auth[1]

    def authenticate_header(self, request):
        """
        Return a string to be used as the value of the `WWW-Authenticate`
        header in a `401 Unauthenticated` response, or `None` if the
        authentication scheme should return `403 Permission Denied` responses.
        """
        return '{0} realm="{1}"'.format(
            api_settings.JWT_AUTH_HEADER_PREFIX,
            self.www_authenticate_realm
        )
