"""
Django settings for torvals project.

Generated by 'django-admin startproject' using Django 1.11.5.

For more information on this file, see
https://docs.djangoproject.com/en/1.11/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/1.11/ref/settings/
"""

import datetime
import os

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/1.11/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'yd15)1te1u6fa4mobiz2s4sa60e6dhn0jpyvn13f=0vo%4#++m'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = []


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

THIRD_PARTY_APPS = [
    'rest_framework',
    'corsheaders',
    'drf_scaffolding',
    'soft_drf'
]

LOCAL_APPS = [
    'angular',
    'app.accounts',
    'app.apps',
    'app.documentation',
    'app.domains',
    'app.providers',
    'app.servers'
]

INSTALLED_APPS += THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    'torvals.middlewares.DisableCsrfCheck',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'soft_drf.utils.middlewares.AuthenticationMiddlewareJWT',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    # 'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'torvals.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            os.path.realpath(os.path.join(BASE_DIR, 'angular'))
        ],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'torvals.wsgi.application'


# Database
# https://docs.djangoproject.com/en/1.11/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
    }
}


# Password validation
# https://docs.djangoproject.com/en/1.11/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


#
# DRF CONFIGURATIONS
#
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASES': (
        'soft_drf.auth.authentication.JSONWebTokenAuthentication',
    ),
    'DEFAULT_FILTER_BACKENDS': [],
    'DEFAULT_RENDERER_CLASSES': (
        'djangorestframework_camel_case.render.CamelCaseJSONRenderer',
        'rest_framework.renderers.JSONRenderer',
    ),
    'DEFAULT_PARSER_CLASSES': (
        'djangorestframework_camel_case.parser.CamelCaseJSONParser',
        'rest_framework.parsers.MultiPartParser',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    )
}


# JWT_AUTH for jwt
JWT_AUTH = {
    'JWT_ENCODE_HANDLER': (
        'soft_drf.auth.utilities.jwt_encode_handler'
    ),
    'JWT_DECODE_HANDLER': (
        'soft_drf.auth.utilities.jwt_decode_handler'
    ),
    'JWT_PAYLOAD_HANDLER': (
        'soft_drf.auth.utilities.jwt_payload_handler'
    ),
    'JWT_PAYLOAD_GET_USER_ID_HANDLER': (
        'soft_drf.auth.utilities.jwt_get_user_id_from_payload_handler'
    ),
    'JWT_RESPONSE_PAYLOAD_HANDLER': (
        'soft_drf.auth.utilities.jwt_response_payload_handler'
    ),
    'VJWT_ALGORITHM': 'HS256',
    'JWT_EXPIRATION_DELTA': datetime.timedelta(days=1800),
    'JWT_VERIFY': True,
    'JWT_VERIFY_EXPIRATION': True,
    'JWT_ALLOW_REFRESH': True,
    'JWT_REFRESH_EXPIRATION_DELTA': datetime.timedelta(days=7),
    'JWT_AUDIENCE': None,
    'JWT_ISSUER': None
}


# Internationalization
# https://docs.djangoproject.com/en/1.11/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_L10N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/1.11/howto/static-files/

STATIC_URL = '/static/'

STATIC_ROOT = os.path.realpath(os.path.join(BASE_DIR, 'static'))

STATICFILES_DIRS = (
    os.path.realpath(os.path.join(BASE_DIR, 'angular')),
)

SHOW_DOCUMENTATION = True
TITLE_DOCUMENTATION = "Torvals Project"


CORS_ORIGIN_WHITELIST = (
    'http://localhost:8000',
    'http://127.0.0.1:8000',
    'http://192.168.100.251:9004',
    'http://192.168.100.251:9005'
)

ALLOWED_HOSTS = [
    '192.168.100.251',
    '127.0.0.1',
]
