// node queues/update-datasetrows.js
require('../config')
require('lib/databases/mongo')

const Queue = require('lib/queue')
const verifyAdjustmentDatasetrows = require('tasks/datasetRows/send-adjustment-datasetrows')

const queue = new Queue({
  name: 'verify-adjustment-datasetrows',
  task: async function (argv) {
    var a
    a = await verifyAdjustmentDatasetrows.run(argv)

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
