ifndef GIT_REV
	GIT_REV := $(shell git rev-parse --short HEAD)
endif

DOCKER_TAG := torvals:$(GIT_REV)

ifndef REGISTRY
	REGISTRY := marathon-lb-internal.marathon.mesos:1000
endif

REMOTE_TAG := $(REGISTRY)/$(DOCKER_TAG)

BIN_DIR ?= ./node_modules/.bin


.PHONY: build run_celery run_django

run_celery:
	celery --app=app.celery:app worker -E -B -l DEBUG --scheduler django_celery_beat.schedulers:DatabaseScheduler --workdir ./backend

run_django:
	python ./backend/manage.py runserver

build:
	@docker build --no-cache --pull -t $(DOCKER_TAG) -f ./backend/Dockerfile ./backend
