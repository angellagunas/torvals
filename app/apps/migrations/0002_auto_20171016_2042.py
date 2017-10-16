# -*- coding: utf-8 -*-
# Generated by Django 1.11.4 on 2017-10-16 20:42
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('apps', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='app',
            name='version',
            field=models.CharField(default='1', help_text='For example the python version is 3.6, the JDK version is 8, etc', max_length=12),
        ),
    ]
