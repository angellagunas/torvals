"""Custom django admin widgets."""
from django_select2.forms import Select2TagWidget


class Select2TagWidgetArray(Select2TagWidget):
    """Custom Widget for arrayfield."""

    def value_from_datadict(self, data, files, name):
        """Overwrite value_from_datadict."""
        values = super(
            Select2TagWidgetArray, self).value_from_datadict(data, files, name)
        return ",".join(values)

    def optgroups(self, name, value, attrs=None):
        """Overwrite optgroups."""
        values = value[0].split(',') if value[0] else []
        selected = set(values)
        subgroup = [self.create_option(name, v, v, selected, i) for i, v in enumerate(values)]
        return [(None, subgroup, 0)]
