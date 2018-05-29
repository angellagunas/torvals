// node crons/check-projects
require('../config')
require('lib/databases/mongo')

const Cron = require('lib/cron')
const verifyProjects = require('tasks/project/verify-and-generate-dataset-for-adjustment-noAPI')

const cron = new Cron({
  tick: '* * * * *',
  task: async function () {
    var a
    a = await verifyProjects.run()
    return a
  }
})

if (require.main === module) {
  cron.schedule()
} else {
  module.exports = cron
}
