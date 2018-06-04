// node crons/check-preprocessing-progress
require('../config')
require('lib/databases/mongo')

const Cron = require('lib/cron')
const checkProjectCycleStatus = require('tasks/project/verify-cycle-status')

const cron = new Cron({
  tick: '00 00 * * *',
  task: async function () {
    var a
    a = await checkProjectCycleStatus.run()
    return a
  }
})

if (require.main === module) {
  cron.schedule()
} else {
  module.exports = cron
}
