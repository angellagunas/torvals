// node queues/update-prices.js
require('../config')
require('lib/databases/mongo')

const Queue = require('lib/queue')
const getPricesQueue = require('tasks/prices/get-prices.js')

const queue = new Queue({
  name: 'verify-prices',
  task: async function (argv) {
    var a
    a = await getPricesQueue.run(argv)

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
