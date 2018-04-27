const config = require('./config')
require('lib/databases/mongo')

const { apiPort } = require('config/server')
const api = require('./api')

// Web services
api.listen(apiPort)
console.log(`Api started on port ${apiPort}`)

// Crons
const crons = require('crons/')
const { each } = require('lodash')
each(crons, cron => cron.schedule())

// Queue
const queues = require('queues/')
each(queues, queue => {
  queue.run()
  queue.setCliLogger()
  queue.setCleanUp()
})
