# -*- coding: utf-8 -*-
# Generated by Django 1.11.4 on 2019-03-20 17:57
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0003_auto_20190320_1741'),
        ('sales_centers', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='salecenter',
            name='project',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to='projects.Project'),
        ),
    ]
