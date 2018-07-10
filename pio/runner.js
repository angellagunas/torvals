require('../config')
require('lib/databases/mongo')

const { pioPort, pioHost } = require('config/server')
const { multiple, numWorkers } = require('config/api-workers')
const pio = require('./')

if (multiple) {
  const cluster = require('cluster')

  if (cluster.isMaster) {
    // Master:
    // Let's fork as many workers as you have logical CPU cores

    for (var i = 0; i < numWorkers; ++i) {
      cluster.fork()
    }
    console.log(`Pio started ${pioHost}, ${numWorkers} workers`)
  } else {
    // Worker:
    // (Workers can share any TCP connection.
    //  In this case its a HTTP server)

    pio.listen(pioPort)
  }
} else {
  pio.listen(pioPort)
  console.log(`Pio started ${pioHost}`)
}
