// node queues/migrate-rows-to-historical.js
require('../config')
require('lib/databases/mongo')
const path = require('path')

const Queue = require('lib/queue')

const queue = new Queue({
  name: 'migrate-rows-to-historical',
  isFile: true,
  task: path.join(__dirname, 'tasks-wrappers/migrate-rows-to-historical.js')
})

if (require.main === module) {
  queue.run()
  queue.setCliLogger()
  queue.setCleanUp()
} else {
  module.exports = queue
}
