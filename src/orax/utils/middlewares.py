# -*- coding: utf-8 -*-
from django.contrib.auth.middleware import get_user
from django.utils.deprecation import MiddlewareMixin
from django.utils.functional import SimpleLazyObject

from orax.utils.authentication import JSONWebTokenAuthentication


class AuthenticationMiddlewareJWT(object):
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.user = SimpleLazyObject(
            lambda: self.__class__.get_jwt_user(request)
        )
        return self.get_response(request)

    @staticmethod
    def get_jwt_user(request):
        user = get_user(request)
        if user.is_authenticated:
            return user

        jwt_authentication = JSONWebTokenAuthentication()

        if jwt_authentication.get_jwt_value(request):
            user, jwt = jwt_authentication.authenticate(request)

        return user


class DisableCsrfCheck(MiddlewareMixin):
    def process_request(self, req):
        attr = '_dont_enforce_csrf_checks'
        is_in_admin = req.path[1:].startswith('admin')
        if not is_in_admin and not getattr(req, attr, False):
            setattr(req, attr, True)
