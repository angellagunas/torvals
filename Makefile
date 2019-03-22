ifndef GIT_REV
	GIT_REV := $(shell git rev-parse --short HEAD)
endif

DOCKER_TAG := pythia-kore:$(GIT_REV)

ifndef REGISTRY
	REGISTRY := marathon-lb-internal.marathon.mesos:1000
endif

REMOTE_TAG := $(REGISTRY)/$(DOCKER_TAG)

BIN_DIR ?= ./node_modules/.bin


.PHONY: build publish

build:
	@docker build --no-cache --pull -t $(DOCKER_TAG) .
