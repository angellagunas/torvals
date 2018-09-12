const config = require('./config')
require('lib/databases/mongo')

const { apiPort } = require('config/server')
const { multiple, numWorkers } = require('config/api-workers')
const api = require('./api')
const { each } = require('lodash')
const Raven = require('raven')

if (config.sentry.dsn) {
  const git = require('git-rev-sync')
  Raven.config(config.sentry.dsn, {release: git.long(), name: 'API/Crons'}).install()
}

const execQueues = () => {
  const queues = require('queues/')
  each(queues, queue => {
    queue.run()
    queue.setCliLogger()
    queue.setCleanUp()
  })
}

const execCrons = () => {
  const crons = require('crons/')
  each(crons, cron => cron.schedule())
}

// Web services
if (multiple) {
  const cluster = require('cluster')

  if (cluster.isMaster) {
    // Master:
    // Let's fork as many workers as you have logical CPU cores

    for (var i = 0; i < numWorkers; ++i) {
      cluster.fork()
    }
    console.log(`Api started ${apiPort}, ${numWorkers} workers`)

    // Crons
    execCrons()

    // Queue
    // execQueues()
  } else {
    // Worker:
    // (Workers can share any TCP connection.
    //  In this case its a HTTP server)

    api.listen(apiPort)
  }
} else {
  api.listen(apiPort)
  console.log(`Api started ${apiPort}`)

  // Crons
  execCrons()

  // Queue
  execQueues()
}
