// node tasks/datasetsRows/send-adjustment-datasetrows.js
require('../../config')
require('lib/databases/mongo')
const moment = require('moment')

const Task = require('lib/task')
const { Organization, Rule } = require('models')

const task = new Task(async function (argv) {
  console.log(`Start ==>  ${moment().format()}`)
  let bulkOps = []

  console.log('Fetching Organizations...')
  const organizations = await Organization.find({})

  let rules = {
    startDate: moment().startOf('year').utc().format('YYYY-MM-DD'),
    cycleDuration: 1,
    cycle: 'M',
    period: 'w',
    periodDuration: 1,
    season: 12,
    cyclesAvailable: 6,
    takeStart: true,
    consolidation: 30,
    forecastCreation: 12,
    rangeAdjustmentRequest: 24,
    rangeAdjustment: 18,
    salesUpload: 6,
    catalogs: [
      {
        name: 'Producto',
        slug: 'producto'
      }, {
        name: 'Centro de venta',
        slug: 'centro-de-venta'
      }, {
        name: 'Canal',
        slug: 'canal'
      }
    ],
    ranges: []
  }

  for (let org of organizations) {
    await Rule.create({
      ...rules,
      organization: org._id,
      isCurrent: true
    })
  }

  console.log(`End ==>  ${moment().format()}`)

  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
