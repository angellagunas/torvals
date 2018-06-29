// node queues/clone-project.js
require('../config')
require('lib/databases/mongo')
const path = require('path')

const Queue = require('lib/queue')

const queue = new Queue({
  name: 'clone-update-rules-main-dataset',
  isFile: true,
  task: path.join(__dirname, 'tasks-wrappers/clone-update-rules-main-dataset.js')
})

if (require.main === module) {
  queue.run()
  queue.setCliLogger()
  queue.setCleanUp()
} else {
  module.exports = queue
}
