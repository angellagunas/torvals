from django.utils.deprecation import MiddlewareMixin


class DisableCsrfCheck(MiddlewareMixin):
    def process_request(self, req):
        if '/api/v1' in req.path:
            attr = '_dont_enforce_csrf_checks'
            if not getattr(req, attr, False):
                setattr(req, attr, True)
