# -*- coding: utf-8 -*-
# Generated by Django 1.11.4 on 2019-02-20 21:56
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('datasets', '0003_dataset_file'),
    ]

    operations = [
        migrations.AlterField(
            model_name='dataset',
            name='error_msg',
            field=models.CharField(blank=True, max_length=255, null=True, verbose_name='error message'),
        ),
        migrations.AlterField(
            model_name='dataset',
            name='max_date',
            field=models.DateField(blank=True, null=True, verbose_name='max date'),
        ),
        migrations.AlterField(
            model_name='dataset',
            name='min_date',
            field=models.DateField(blank=True, null=True, verbose_name='min date'),
        ),
        migrations.AlterField(
            model_name='dataset',
            name='rule',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='rules.Rule'),
        ),
    ]
