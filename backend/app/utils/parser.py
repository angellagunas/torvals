"""Custom parser."""
import json
import re

import six
from django.conf import settings
from django.core.files import File
from django.http import QueryDict
from rest_framework.exceptions import ParseError
from rest_framework.parsers import JSONParser


class CamelCaseJSONParser(JSONParser):
    """Overwrite parser."""

    def parse(self, stream, media_type=None, parser_context=None):
        """Overwrite parse."""
        methods_to_scape = getattr(
            parser_context['view'],
            'scape_camel_case_parser',
            []
        )

        method = parser_context['view'].action

        if method in methods_to_scape:
            return super(CamelCaseJSONParser, self).parse(stream, media_type, parser_context)

        parser_context = parser_context or {}
        encoding = parser_context.get("encoding", settings.DEFAULT_CHARSET)

        try:
            data = stream.read().decode(encoding)
            return self.underscoreize(
                json.loads(data),
                **{"no_underscore_before_number": False}
            )
        except ValueError as exc:
            raise ParseError("JSON parse error - %s" % six.text_type(exc))

    def underscoreize(self, data, **options):
        """Transform camel case to lower case an separate by underscore."""
        if isinstance(data, dict):
            new_dict = {}
            for key, value in self._get_iterable(data):
                if isinstance(key, six.string_types):
                    new_key = self._camel_to_underscore(key, **options)
                else:
                    new_key = key
                new_dict[new_key] = self.underscoreize(value, **options)

            if isinstance(data, QueryDict):
                new_query = QueryDict(mutable=True)
                for key, value in new_dict.items():
                    new_query.setlist(key, value)
                return new_query
            return new_dict
        if self._is_iterable(data) and not isinstance(data, (six.string_types, File)):  # noqa
            return [self.underscoreize(item, **options) for item in data]

        return data

    def _get_iterable(self, data):
        if isinstance(data, QueryDict):
            return data.lists()
        else:
            return data.items()

    def _camel_to_underscore(self, name, **options):
        underscoreize_re = self._get_underscoreize_re(options)
        return underscoreize_re.sub(r"\1_\2", name).lower()

    def _is_iterable(self, obj):
        try:
            iter(obj)
        except TypeError:
            return False
        else:
            return True

    def _get_underscoreize_re(self, options):
        if options.get("no_underscore_before_number"):
            pattern = r"([a-z]|[0-9]+[a-z]?|[A-Z]?)([A-Z])"
        else:
            pattern = r"([a-z]|[0-9]+[a-z]?|[A-Z]?)([A-Z0-9])"
        return re.compile(pattern)
