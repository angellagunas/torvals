#!/bin/bash

set -e

python /app/manage.py migrate

supervisord -c /etc/supervisor/supervisord.conf -n
