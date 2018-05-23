// node crons/check-datasets
require('../config')
require('lib/databases/mongo')

const Cron = require('lib/cron')
const verifyProcessingDatasets = require('tasks/dataset/verify-processing-datasets')

const cron = new Cron({
  tick: '* * * * *',
  task: async function () {
    var a, b
    a = await verifyProcessingDatasets.run()
    return a && b
  }
})

if (require.main === module) {
  cron.schedule()
} else {
  module.exports = cron
}
