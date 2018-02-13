// node crons/check-forecasts
require('../config')
require('lib/databases/mongo')

const Cron = require('lib/cron')
const verifyCreatedForecasts = require('tasks/forecast/verify-created-forecasts')
const verifyProcessingForecasts = require('tasks/forecast/verify-processing-forecasts')

const cron = new Cron({
  tick: '* * * * *',
  task: async function () {
    var a, b
    a = await verifyCreatedForecasts.run()
    b = await verifyProcessingForecasts.run()
    return a && b
  }
})

if (require.main === module) {
  cron.schedule()
} else {
  module.exports = cron
}
