const config = require('./config')
require('lib/databases/mongo')

const { apiPort, appPort, adminPort } = require('config/server')
const app = require('./app')
const api = require('./api')
const admin = require('./admin')

// Web services
api.listen(apiPort)
console.log(`Api started on port ${apiPort}`)

app.listen(appPort)
console.log(`App started on port ${appPort}`)

admin.listen(adminPort)
console.log(`App started on port ${adminPort}`)

// Crons
const checkDatasets = require('crons/check-preprocessing-progress')

checkDatasets.run()

// Queue
const finishUpload = require('queues/finish-upload')

finishUpload.run()
finishUpload.setCleanUp()
