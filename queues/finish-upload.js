// node queues/finish-upload.js
require('../config')
require('lib/databases/mongo')

const Queue = require('lib/queue')
const recreateAndUpload = require('tasks/dataset/recreate-and-upload-dataset')

const queue = new Queue({
  name: 'finish-upload',
  task: async function (argv) {
    var a, b
    a = await recreateAndUpload.run(argv)

    return a && b
  }
})

if (require.main === module) {
  queue.run()
  queue.setCliLogger()
  queue.setCleanUp()
} else {
  module.exports = queue
}
