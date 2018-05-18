// node queues/finish-upload.js
require('../config')
require('lib/databases/mongo')

const Queue = require('lib/queue')
const saveDataset = require('tasks/dataset/process/save-dataset')
const processDataset = require('tasks/dataset/process/process-dataset')
const saveDatasetRows = require('tasks/dataset/process/save-datasetrows')

const queue = new Queue({
  name: 'save-dataset',
  task: async function (argv) {
    let a, b, c
    a = await saveDataset.run(argv)
    b = await processDataset.run(argv)
    c = await saveDatasetRows.run(argv)
    return a && b && c
  }
})

if (require.main === module) {
  queue.run()
  queue.setCliLogger()
  queue.setCleanUp()
} else {
  module.exports = queue
}
