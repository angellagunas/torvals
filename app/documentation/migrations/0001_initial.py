# -*- coding: utf-8 -*-
# Generated by Django 1.11.4 on 2017-10-17 16:44
from __future__ import unicode_literals

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Answer',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('body', models.TextField(help_text='A installation guide could has a extra notes or an common error could has one or more ways to fix it. The text should be formatted in markdown')),
                ('author', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='answers', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='Documentation',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(help_text="The document title. For example: 'Jenkins installation on ubuntu 16.04' or a common error like 'CSRF token missing or incorrect.'", max_length=200)),
                ('body', models.TextField(help_text='Is the content of the guide or how to fix a common error. The text should be formatted in markdown')),
                ('author', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='documents', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='DocumentationType',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(help_text='The document type could be Installation guide, Error Documentation, etc.', max_length=100)),
            ],
        ),
        migrations.AddField(
            model_name='documentation',
            name='type',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='documents', to='documentation.DocumentationType'),
        ),
    ]
