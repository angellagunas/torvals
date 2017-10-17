# -*- coding: utf-8 -*-
from soft_drf.routing.v1.routers import router

from .viewsets import (
    documentationtype,
    documentation,
    answer,
)


router.register(
    r"documentationtypes",
    documentationtype.DocumentationTypeViewSet,
    base_name="documentationtypes",
)

router.register(
    r"documentations",
    documentation.DocumentationViewSet,
    base_name="documentations",
)

router.register(
    r"answers",
    answer.AnswerViewSet,
    base_name="answers",
)
