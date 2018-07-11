// node queues/pio-create-app.js
require('../config')
require('lib/databases/mongo')
const path = require('path')

const Queue = require('lib/queue')

const queue = new Queue({
  name: 'pio-deploy-engine',
  isFile: true,
  task: path.join(__dirname, 'tasks-wrappers/pio-deploy-engine.js')
})

if (require.main === module) {
  queue.run()
  queue.setCliLogger()
  queue.setCleanUp()
} else {
  module.exports = queue
}
