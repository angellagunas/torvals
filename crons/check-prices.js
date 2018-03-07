// node crons/check-prices
require('../config')
require('lib/databases/mongo')

const Cron = require('lib/cron')
const verifyPrices = require('tasks/prices/get-prices')

const cron = new Cron({
  tick: '* * * * *',
  task: async function () {
    var a
    a = await verifyPrices.run()
    return a
  }
})

if (require.main === module) {
  cron.schedule()
} else {
  module.exports = cron
}
