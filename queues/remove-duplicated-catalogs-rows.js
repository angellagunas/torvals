// node queues/remove-duplicated-catalogs-rows.js --org uuid
require('../config')
require('lib/databases/mongo')
const path = require('path')

const Queue = require('lib/queue')

const queue = new Queue({
  name: 'remove-duplicated-catalogs-rows',
  isFile: true,
  task: path.join(__dirname, 'tasks-wrappers/remove-duplicated-catalogs-rows.js')
})

if (require.main === module) {
  queue.run()
  queue.setCliLogger()
  queue.setCleanUp()
} else {
  module.exports = queue
}
