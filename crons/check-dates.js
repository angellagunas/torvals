// node crons/check-dates
require('../config')
require('lib/databases/mongo')

const Cron = require('lib/cron')
const verifyDates = require('tasks/abraxas-date/get-dates')

const cron = new Cron({
  tick: '0 3 * * *',
  task: async function () {
    var a
    a = await verifyDates.run()
    return a
  }
})

if (require.main === module) {
  cron.schedule()
} else {
  module.exports = cron
}
