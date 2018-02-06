// node crons/check-preprocessing-progress
require('../config')
require('lib/databases/mongo')

const Cron = require('lib/cron')
const verifyDatasetRowsOnError = require('tasks/datasetRows/verify-datasetrows-on-error')

const cron = new Cron({
  tick: '* * * * *',
  task: async function () {
    var a
    a = await verifyDatasetRowsOnError.run()
    return a
  }
})

if (require.main === module) {
  cron.schedule()
} else {
  module.exports = cron
}
