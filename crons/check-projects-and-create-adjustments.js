// node crons/check-preprocessing-progress
require('../config')
require('lib/databases/mongo')

const Cron = require('lib/cron')
const verifyProjects = require('tasks/project/verify-and-generate-dataset-for-adjustment')
const verifyDatasets = require('tasks/dataset/verify-adjustment-datasets')

const cron = new Cron({
  tick: '* * * * *',
  task: async function () {
    var a, b
    a = await verifyProjects.run()
    b = await verifyDatasets.run()
    return a && b
  }
})

if (require.main === module) {
  cron.schedule()
} else {
  module.exports = cron
}
