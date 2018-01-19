require('../config')
require('lib/databases/mongo')

const cluster = require('cluster')
const os = require('os')
const { apiPort } = require('config/server')
const app = require('./')

const numCPUs = os.cpus().length

if (cluster.isMaster) {
  // Master:
  // Let's fork as many workers as you have logical CPU cores

  for (var i = 0; i < numCPUs; ++i) {
    cluster.fork()
  }
  console.log(`Api started on port ${apiPort}, ${numCPUs} workers`)
} else {
  // Worker:
  // (Workers can share any TCP connection.
  //  In this case its a HTTP server)

  app.listen(apiPort)
}
