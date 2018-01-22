require('../config')
require('lib/databases/mongo')

const { apiPort } = require('config/server')
const { multiple, numWorkers } = require('config/multiple-workers')
const app = require('./')

if (multiple) {
  const cluster = require('cluster')

  if (cluster.isMaster) {
    // Master:
    // Let's fork as many workers as you have logical CPU cores

    for (var i = 0; i < numWorkers; ++i) {
      cluster.fork()
    }
    console.log(`Api started on port ${apiPort}, ${numWorkers} workers`)
  } else {
    // Worker:
    // (Workers can share any TCP connection.
    //  In this case its a HTTP server)

    app.listen(apiPort)
  }
} else {
  app.listen(apiPort)
  console.log(`Api started on port ${apiPort}`)
}
