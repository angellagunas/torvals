const config = require('./config')
require('lib/databases/mongo')

const queues = require('./')
const { each } = require('lodash')
const { multiple, numWorkers } = require('config/queue-workers')

if (multiple) {
  const cluster = require('cluster')

  if (cluster.isMaster) {
    // Master:
    // Let's fork as many workers as you have configured (default: #CPU cores)
    for (var i = 0; i < numWorkers; ++i) {
      cluster.fork()
    }
    console.log(`Queues started, ${numWorkers} workers for each queue`)
  } else {
    // Worker
    each(queues, queue => {
      queue.run()
      queue.setCliLogger()
      queue.setCleanUp()
    })
  }
} else {
  each(queues, queue => {
    queue.run()
    queue.setCliLogger()
    queue.setCleanUp()
  })
  console.log(`Queues started`)
}
