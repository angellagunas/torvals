// node queues/finish-upload.js
require('../config')
require('lib/databases/mongo')
const path = require('path')

const Queue = require('lib/queue')

const queue = new Queue({
  name: 'get-anomalies',
  isFile: true,
  task: path.join(__dirname, 'tasks-wrappers/get-anomalies.js')
})

if (require.main === module) {
  queue.run()
  queue.setCliLogger()
  queue.setCleanUp()
} else {
  module.exports = queue
}
