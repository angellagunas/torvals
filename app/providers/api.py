# -*- coding: utf-8 -*-
from soft_drf.routing.v1.routers import router

from .viewsets import (
    provider,
)


router.register(
    r"providers",
    provider.ProviderViewSet,
    base_name="providers",
)
