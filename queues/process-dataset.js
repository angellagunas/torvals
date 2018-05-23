// node queues/finish-upload.js
require('../config')
require('lib/databases/mongo')

const Queue = require('lib/queue')
const processDataset = require('tasks/dataset/process/process-dataset')

const queue = new Queue({
  name: 'process-dataset',
  task: async function (argv) {
    let a
    a = await processDataset.run(argv)
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
