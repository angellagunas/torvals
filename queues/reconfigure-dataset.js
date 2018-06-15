// node queues/clone-project.js
require('../config')
require('lib/databases/mongo')
const path = require('path')

const Queue = require('lib/queue')

const queue = new Queue({
  name: 'reconfigure-dataset',
  isFile: true,
  task: path.join(__dirname, 'tasks-wrappers/reconfigure-dataset.js')
})

if (require.main === module) {
  queue.run()
  queue.setCliLogger()
  queue.setCleanUp()
} else {
  module.exports = queue
}
