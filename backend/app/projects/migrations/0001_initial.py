# -*- coding: utf-8 -*-
# Generated by Django 1.11.4 on 2019-04-02 22:14
from __future__ import unicode_literals

import django.contrib.postgres.fields
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Project',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_date', models.DateTimeField(auto_now_add=True, null=True, verbose_name='created date')),
                ('last_modified', models.DateTimeField(auto_now=True, null=True, verbose_name='last modified')),
                ('name', models.CharField(max_length=600, verbose_name='name')),
                ('is_active', models.BooleanField(default=True, verbose_name='is active')),
                ('status', models.CharField(choices=[('error', 'error'), ('ready', 'ready')], default='ready', max_length=255, verbose_name='status')),
                ('description', models.CharField(max_length=255, verbose_name='description')),
                ('admin_emails', django.contrib.postgres.fields.ArrayField(base_field=models.CharField(max_length=200), blank=True, null=True, size=None)),
                ('can_adjust', models.BooleanField(default=True, help_text='Define si se puede ajustar la prediccion en el proyecto.')),
                ('can_dowload_report', models.BooleanField(default=True, help_text='Define si el usuario final puede descargar el reporte.')),
                ('can_send_report', models.BooleanField(default=True, help_text='Define si el usuario final puede enviar el reporte por email a su superior.')),
                ('date', models.CharField(blank=True, max_length=255, null=True, verbose_name='Fecha')),
                ('ceve_id', models.CharField(blank=True, max_length=255, null=True, verbose_name='Centro de venta ID')),
                ('product_id', models.CharField(blank=True, max_length=255, null=True, verbose_name='Producto ID')),
                ('transits', models.CharField(blank=True, max_length=255, null=True, verbose_name='Transitos')),
                ('in_stock', models.CharField(blank=True, max_length=255, null=True, verbose_name='Inventario')),
                ('safety_stock', models.CharField(blank=True, max_length=255, null=True, verbose_name='Safety stock')),
                ('prediction', models.CharField(blank=True, max_length=255, null=True, verbose_name='Predicción')),
                ('adjustment', models.CharField(blank=True, max_length=255, null=True, verbose_name='Predicción ajustada')),
                ('beds', models.CharField(blank=True, max_length=255, null=True, verbose_name='Pedido en camas')),
                ('pallets', models.CharField(blank=True, max_length=255, null=True, verbose_name='Pedido en tarimas')),
                ('dynamic_columns_name', django.contrib.postgres.fields.ArrayField(base_field=models.CharField(max_length=200), blank=True, null=True, size=None)),
            ],
            options={
                'verbose_name': 'project',
                'verbose_name_plural': 'projects',
            },
        ),
    ]