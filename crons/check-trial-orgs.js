// node crons/check-trial-orgs
require('../config')
require('lib/databases/mongo')

const Cron = require('lib/cron')
const verifyTrials = require('tasks/organization/verify-trial-date')

const cron = new Cron({
  tick: '0 3 * * *',
  task: async function () {
    var a
    a = await verifyTrials.run()
    return a
  }
})

if (require.main === module) {
  cron.schedule()
} else {
  module.exports = cron
}
