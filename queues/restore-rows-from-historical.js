// node queues/restore-rows-from-historical.js
require('../config')
require('lib/databases/mongo')
const path = require('path')

const Queue = require('lib/queue')

const queue = new Queue({
  name: 'restore-rows-from-historical',
  isFile: true,
  task: path.join(__dirname, 'tasks-wrappers/restore-rows-from-historical.js')
})

if (require.main === module) {
  queue.run()
  queue.setCliLogger()
  queue.setCleanUp()
} else {
  module.exports = queue
}
