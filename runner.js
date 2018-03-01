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
const checkDatasets = require('crons/check-datasets')
checkDatasets.schedule()

const checkProjects = require('crons/check-projects')
checkProjects.schedule()

const checkDatasetRows = require('crons/check-datasetsrows')
checkDatasetRows.schedule()

// Queue
const finishUpload = require('queues/finish-upload')
finishUpload.run()
finishUpload.setCliLogger()
finishUpload.setCleanUp()

const updateDatasetRows = require('queues/update-datasetrows')
updateDatasetRows.run()
updateDatasetRows.setCliLogger()
updateDatasetRows.setCleanUp()
