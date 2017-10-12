# -*- coding: utf-8 -*-
from soft_drf.routing.v1.routers import router

from .viewsets import (
    domain,
)


router.register(
    r"domains",
    domain.DomainViewSet,
    base_name="domains",
)
