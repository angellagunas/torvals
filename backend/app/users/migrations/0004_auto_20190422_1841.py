# -*- coding: utf-8 -*-
# Generated by Django 1.11.4 on 2019-04-22 18:41
from __future__ import unicode_literals

import django.contrib.postgres.fields
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0003_remove_user_can_edit'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='user',
            options={'ordering': ('email',), 'permissions': (('can_adjust_sales', 'Can adjust sales'), ('can_adjust_last_order', 'Can adjust last order'), ('can_add_order', 'Can add order')), 'verbose_name': 'usuario', 'verbose_name_plural': 'usuarios'},
        ),
        migrations.AlterField(
            model_name='user',
            name='admin_emails',
            field=django.contrib.postgres.fields.ArrayField(base_field=models.CharField(max_length=200), blank=True, default=list, null=True, size=None),
        ),
    ]