// node queues/finish-upload.js
require('../config')
require('lib/databases/mongo')

const Queue = require('lib/queue')
const saveDataset = require('tasks/dataset/process/save-dataset')

const queue = new Queue({
  name: 'save-dataset',
  task: async function (argv) {
    let a
    a = await saveDataset.run(argv)
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
