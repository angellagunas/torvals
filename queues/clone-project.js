// node queues/clone-project.js
require('../config')
require('lib/databases/mongo')

const Queue = require('lib/queue')
const cloneProject = require('tasks/project/clone')

const queue = new Queue({
  name: 'clone-project',
  task: async function (argv) {
    var a
    a = await cloneProject.run(argv)

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
