// node queues/finish-upload.js
require('../config')
require('lib/databases/mongo')

const Queue = require('lib/queue')
const saveDatasetRows = require('tasks/dataset/process/save-datasetrows')

const queue = new Queue({
  name: 'save-datasetrows',
  task: async function (argv) {
    let a
    a = await saveDatasetRows.run(argv)
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
