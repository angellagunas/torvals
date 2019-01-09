require('../config')
require('lib/databases/mongo')

const { apiPort, apiHost } = require('config/server')
const { multiple, numWorkers } = require('config/api-workers')
const app = require('./')

if (multiple) {
  const cluster = require('cluster')

  if (cluster.isMaster) {
    // Master:
    // Let's fork as many workers as you have logical CPU cores

    for (var i = 0; i < numWorkers; ++i) {
      cluster.fork()
    }
    console.log(`Api started ${apiHost}, ${numWorkers} workers`)
  } else {
    // Worker:
    // (Workers can share any TCP connection.
    //  In this case its a HTTP server)

    //const server = app.listen(apiPort)
    //server.timeout = 600000
    app.listen(apiPort)
  }
} else {
  //const server =  app.listen(apiPort)
  //server.timeout = 600000
  app.listen(apiPort)
  console.log(`Api started ${apiHost}`)
}
