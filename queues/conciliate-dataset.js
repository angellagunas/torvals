// node queues/finish-upload.js
require('../config')
require('lib/databases/mongo')

const Queue = require('lib/queue')
const conciliateDataset = require('tasks/dataset/process/conciliate-dataset')

const queue = new Queue({
  name: 'conciliate-dataset',
  task: async function (argv) {
    let a
    a = await conciliateDataset.run(argv)

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
