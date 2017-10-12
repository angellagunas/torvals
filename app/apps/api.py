# -*- coding: utf-8 -*-
from soft_drf.routing.v1.routers import router

from .viewsets import (
    apptype,
    app,
    port,
)


router.register(
    r"apptypes",
    apptype.AppTypeViewSet,
    base_name="apptypes",
)

router.register(
    r"apps",
    app.AppViewSet,
    base_name="apps",
)

router.register(
    r"ports",
    port.PortViewSet,
    base_name="ports",
)
