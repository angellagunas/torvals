// node tasks/migrations/organization/verify-billing-date
require('../../config')
require('lib/databases/mongo')
const Task = require('lib/task')
const moment = require('moment')

const {Organization} = require('models')

const task = new Task(async function (argv) {
  console.log('Running task =>', argv)
  const currentDate = moment.utc()

  const trialOrganizations = await Organization.count({
    status: 'active',
    billingEnd: {$lte: currentDate}
  })

  console.log('Organizations with a completed billing period =>', trialOrganizations)

  await Organization.update(
    {
      status: 'active',
      billingEnd: {$lte: currentDate}
    },
    {status: 'inactive'},
    {multi: true}
  )
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
