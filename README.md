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

Before running the app remember set the env variables, these are a few of them, to see  all the variables look [.env.default](.env.default)

```bash
API_PORT=3000
API_HOST=http://pythia.dev:3000

APP_PORT=4000
APP_HOST=http://pythia.dev:4000
```

Run the whole APP with

```bash
node runner.js
```

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

Create your USER

```bash
node tasks/create-admin --email admin@app.com --password mypassword --name admin
```

APP and ADMIN requires the admin to be running to work. On dev this servers run webpack live server.

## Running the tests

```bash
make run-test
```

## Deployment
