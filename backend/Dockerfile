FROM python:3.6
MAINTAINER Angel Lagunas <alagunas@grupoabraxas.com>

RUN apt-get update && apt-get install -y libxml2-dev libxslt1-dev libffi-dev build-essential libssl-dev curl git supervisor libghc-hdbc-postgresql-dev nginx --no-install-recommends && rm -rf /var/lib/apt/lists/*
RUN pip install --upgrade pip

RUN mkdir /app
ADD . /app
WORKDIR /app

RUN chmod +x /app/config/start.sh

RUN rm /etc/nginx/sites-enabled/default

COPY ./config/supervisord.conf /etc/supervisor/conf.d/app.conf
RUN ln -s /app/config/nginx-python /etc/nginx/sites-enabled/default

RUN pip install -r requirements/base.txt
RUN python /app/manage.py collectstatic

EXPOSE 8000

CMD ["/app/config/start.sh"]
