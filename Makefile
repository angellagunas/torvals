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

help:
	@echo
	@echo "  \033[34mapi-server\033[0m  start dev server"

api-server:
	@$(BIN_DIR)/nodemon api/runner.js

app-server:
	@$(BIN_DIR)/nodemon --ignore app/frontend app/runner.js

app-dist: export NODE_ENV = production
app-dist:
	@$(BIN_DIR)/webpack --config ./app/webpack/prod.config.js --progress

admin-server:
	@$(BIN_DIR)/nodemon --ignore admin/frontend admin/runner.js

admin-dist: export NODE_ENV = production
admin-dist:
	@$(BIN_DIR)/webpack --config ./admin/webpack/prod.config.js --progress

dist: export NODE_ENV = production
dist:
	@$(BIN_DIR)/webpack --config ./admin/webpack/prod.config.js --progress && $(BIN_DIR)/webpack --config ./app/webpack/prod.config.js --progress

run-test:
	@$(BIN_DIR)/mocha

ci:
	cp .env.default .env
	docker pull mongo:latest
	docker pull redis:alpine
	docker-compose build api
	docker-compose up -d redisdb
	docker-compose up -d mongodb
	docker-compose up -d api
	docker-compose exec -T api npm test

build:
	@docker build --no-cache --pull -t $(DOCKER_TAG) .

tag_remote:
	@docker tag $(DOCKER_TAG) $(REMOTE_TAG)

publish: tag_remote
	@docker push $(REMOTE_TAG)

update_settings: export DOCKER_IMAGE = $(REMOTE_TAG)
update_settings:
	@envsubst < ./marathon/kore.json > ./marathon.json
