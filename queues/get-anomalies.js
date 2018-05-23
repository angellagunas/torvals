// node queues/finish-upload.js
require('../config')
require('lib/databases/mongo')

const Queue = require('lib/queue')
const getAnomalies = require('tasks/anomalies/get-anomalies')

const queue = new Queue({
  name: 'get-anomalies',
  task: async function (argv) {
    let a
    a = await getAnomalies.run(argv)
    return a
  }
})

if (require.main === module) {
  queue.run()
  queue.setCliLogger()
  queue.setCleanUp()
} else {
  module.exports = queue
}
