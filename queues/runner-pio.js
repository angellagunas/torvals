const createApp = require('./pio-create-app')
const loadAppData = require('./pio-load-data')
const engineBuild = require('./pio-build-engine')
const engineTrain = require('./pio-train-engine')
const engineDeploy = require('./pio-deploy-engine')
const createJson = require('./pio-create-json')

const { each } = require('lodash')

const queues = [createApp, loadAppData, engineBuild, engineTrain, engineDeploy, createJson]

each(queues, queue => {
  queue.run()
  queue.setCliLogger()
  queue.setCleanUp()
})
console.log(`PIO queues started`)
