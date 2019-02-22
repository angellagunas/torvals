"""Admin for routes module."""
from django import forms
from django.contrib import admin
from orax.batch.models import Batch


class BatchForm(forms.ModelForm):
    """Form to admin batchs."""

    class Meta:
        """Define behavior of class."""

        model = Batch
        exclude = []



class BatchAdmin(admin.ModelAdmin):
    """Admin to manage batchs."""

    def save_model(self, request, obj, form, change):
        """Save instance."""
        file = pd.read_csv(obj.file, sep='|', index_col=False)
        super(BatchAdmin, self).save_model(request, obj, form, change)


admin.site.register(Batch, BatchAdmin)
