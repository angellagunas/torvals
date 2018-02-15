# Pythia-kore

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes

### Prerequisites

* Node.js v8+
* NPM v5+
* MongoDB 3+
* Set the following host in your hosts file

```hosts
127.0.0.1       pythia.dev
127.0.0.1       barcel.pythia.dev
127.0.0.1       globo.pythia.dev
```

### Installing

* Fork and clone
* Change to branch dev
* Install dependencies

```bash
npm install
```

Before running the app remember to set the env variables by creating a new file named `.env.development`. These are a few of them:

```bash
API_PORT=3000
API_HOST=http://pythia.dev:3000

APP_PORT=4000
APP_HOST=http://pythia.dev:4000
```

To see all the enviroment variables available, take a look at [.env.default](.env.default)

Run API with

```bash
make api-server
```

Run ADMIN with

```bash
make admin-server
```

Run APP with

```bash
make app-server
```

You could alternatively execute `app`, `admin` and `api` by running

```bash
node runner.js
```

Create your USER

```bash
node tasks/create-admin --email admin@app.com --password mypassword --name admin
```

APP and ADMIN requires the admin to be running to work. On dev this servers run webpack live server.

Now you can access the [admin app](http://barcel.pythia.dev:5000/) and associate an organization with your user, with this you can access the [app](http://barcel.pythia.dev:4000/)

If you can't access the app from the Chrome browser, we recommend you try it with Firefox

## Running the tests

```bash
make run-test
```

## Deployment

Before building the docker image we need to add a `.env.production` with:
```
MONGO_DB=pythia-db
MONGO_HOST=mongodb
REDIS_HOST=redisdb

API_HOST=<API BASE URL>
APP_HOST=<APP BASE URL>
ADMIN_HOST=<ADMIN BASE URL>

# To send invites
EMAIL_SEND=false
EMAIL_PROVIDER=mandrill
EMAIL_KEY=<MANDRIL TOKEN>

# Multiple workers for API, by default sets NUM_WORKERS to the same number of processing cores available
MULTIPLE_WORKERS=true
```

To use docker compose do:
```bash
docker-compose build
docker-compose up -d
```

This starts 3 containers, one with nodejs, one with mongodb and one with redis. Do:
```bash
docker-compose ps
```
To verify that the 3 containers are running.

Node container exposes with 3 ports open:
```
[API PORT]  3000
[APP PORT] 4000 
[ADMIN PORT] 5000 
```
They will need to be wired Mesos DNS. 

The first time the DB is started, the seed data needs to be added with:

```
docker exec pythia_web_1 node tasks/seed-data.js --file tasks/base-data/seed-data.json
```

