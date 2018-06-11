// node tasks/datasetsRows/send-adjustment-datasetrows.js
require('../../config')
require('lib/databases/mongo')
const moment = require('moment')
const slugify = require('underscore.string/slugify')

const Task = require('lib/task')
const { Role } = require('models')

const task = new Task(async function (argv) {
  console.log('Fetching AdjustmentRequests...')

  const ml1 = await Role.findOne({ slug: 'manager-level-1' })
  const ml2 = await Role.findOne({ slug: 'manager-level-2' })

  console.log(ml1, ml2)

  ml2.set({priority: 5})
  ml1.set({priority: 6})

  await ml2.save()
  await ml1.save()

  let supervisor = await Role.findOne({slug: 'supervisor'})

  if (!supervisor) {
    supervisor = await Role.create({
      'name': 'Supervisor',
      'slug': slugify('Supervisor'),
      'isDefault': false,
      'priority': 4
    })
  }

  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
