// node queues/finish-upload.js
require('../config')
require('lib/databases/mongo')

const Queue = require('lib/queue')

const queue = new Queue({
  name: 'finish-upload',
  task: async function (argv) {
    console.log('=> inside task')

    return argv
  }
})

if (require.main === module) {
  queue.run()
  queue.setCliLogger()
  queue.setCleanUp()
} else {
  module.exports = queue
}
