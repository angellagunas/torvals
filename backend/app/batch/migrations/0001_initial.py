# -*- coding: utf-8 -*-
# Generated by Django 1.11.4 on 2019-04-02 22:14
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('projects', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Batch',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_date', models.DateTimeField(auto_now_add=True, null=True, verbose_name='created date')),
                ('last_modified', models.DateTimeField(auto_now=True, null=True, verbose_name='last modified')),
                ('name', models.CharField(max_length=600, verbose_name='name')),
                ('is_active', models.BooleanField(default=True, verbose_name='is active')),
                ('file', models.FileField(upload_to='files')),
                ('description', models.CharField(max_length=255, verbose_name='description')),
                ('type', models.CharField(choices=[('products', 'products'), ('sales_centers', 'sales_centers')], max_length=255, verbose_name='type')),
                ('separated_by', models.CharField(default=',', max_length=1, verbose_name='separated_by')),
                ('project', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='projects.Project')),
            ],
            options={
                'verbose_name': 'batch',
                'verbose_name_plural': 'batch',
            },
        ),
    ]