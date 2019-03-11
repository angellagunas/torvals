FROM python:3.6
MAINTAINER Angel Lagunas <alagunas@grupoabraxas.com>

RUN apt-get update && apt-get install -y libxml2-dev libxslt1-dev libffi-dev build-essential libssl-dev curl git supervisor libghc-hdbc-postgresql-dev nginx --no-install-recommends && rm -rf /var/lib/apt/lists/*
RUN pip install --upgrade pip

RUN mkdir /orax
ADD . /orax
WORKDIR /orax

RUN mkdir /var/log/uwsgi && \
    touch /var/log/uwsgi/uwsgi.log && \
    touch /var/log/supervisor/supervisord.log && \
    touch /var/log/supervisor/django-stdout.log && \
    touch /var/log/supervisor/django-stderr.log && \
    touch /var/log/nginx/error.log && \
    touch /var/log/nginx/access.log && \
    rm /etc/nginx/sites-enabled/default

COPY ./config/supervisord.conf /etc/supervisor/conf.d/orax.conf
RUN ln -s /orax/config/nginx-python /etc/nginx/sites-enabled/default

RUN pip install -r requirements/base.txt
RUN python /orax/manage.py collectstatic

EXPOSE 8000

ENTRYPOINT supervisord -c /etc/supervisor/supervisord.conf -n
