// node crons/check-preprocessing-progress
require('../config')
require('lib/databases/mongo')

const Cron = require('lib/cron')
const verifyPreprocessingDatasets = require('tasks/dataset/verify-preprocessing-datasets')
const verifyProcessingDatasets = require('tasks/dataset/verify-processing-datasets')

const cron = new Cron({
  tick: '* * * * *',
  task: async function () {
    var a, b
    a = await verifyPreprocessingDatasets.run()
    b = await verifyProcessingDatasets.run()
    return a && b
  }
})

if (require.main === module) {
  cron.schedule()
} else {
  module.exports = cron
}
