// node crons/check-billing-orgs
require('../config')
require('lib/databases/mongo')

const Cron = require('lib/cron')
const verifyBilling = require('tasks/organization/verify-billing-date')

const cron = new Cron({
  tick: '0 3 * * *',
  task: async function () {
    var a
    a = await verifyBilling.run()
    return a
  }
})

if (require.main === module) {
  cron.schedule()
} else {
  module.exports = cron
}
