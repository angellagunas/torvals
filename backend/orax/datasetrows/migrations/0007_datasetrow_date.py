# -*- coding: utf-8 -*-
# Generated by Django 1.11.4 on 2019-02-26 16:14
from __future__ import unicode_literals

import datetime
from django.db import migrations, models
from django.utils.timezone import utc


class Migration(migrations.Migration):

    dependencies = [
        ('datasetrows', '0006_auto_20190225_2344'),
    ]

    operations = [
        migrations.AddField(
            model_name='datasetrow',
            name='date',
            field=models.DateField(default=datetime.datetime(2019, 2, 26, 16, 14, 49, 93622, tzinfo=utc)),
            preserve_default=False,
        ),
    ]
