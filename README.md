# Pythia-kore

This repo requires:

- Node.js v8+
- NPM v5+
- MongoDB 3+ 

###Development

Clone the repo and install
```bash
npm install
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

APP and ADMIN requires the admin to be running to work. On dev this servers run webpack live server.

To run test run
```bash
make run-test
```
