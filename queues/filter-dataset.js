// node queues/finish-upload.js
require('../config')
require('lib/databases/mongo')

const Queue = require('lib/queue')
const filterDataset = require('tasks/dataset/process/filter-dataset')

const queue = new Queue({
  name: 'filter-dataset',
  task: async function (argv) {
    let a
    a = await filterDataset.run(argv)

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
