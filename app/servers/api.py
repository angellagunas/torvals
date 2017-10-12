# -*- coding: utf-8 -*-
from soft_drf.routing.v1.routers import router

from .viewsets import (
    server,
    environment,
)


router.register(
    r"servers",
    server.ServerViewSet,
    base_name="servers",
)

router.register(
    r"environments",
    environment.EnvironmentViewSet,
    base_name="environments",
)
