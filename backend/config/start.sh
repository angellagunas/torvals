#!/bin/bash

set -e

python /orax/manage.py migrate

supervisord -c /etc/supervisor/supervisord.conf -n
