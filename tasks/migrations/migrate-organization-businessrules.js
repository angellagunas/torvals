// node tasks/datasetsRows/send-adjustment-datasetrows.js
require('../../config')
require('lib/databases/mongo')
const moment = require('moment')

const Task = require('lib/task')
const { Organization } = require('models')

const task = new Task(async function (argv) {
  console.log(`Start ==>  ${moment().format()}`)
  let bulkOps = []

  console.log('Fetching Organizations...')
  const organizations = await Organization.find({})

  for (let org of organizations) {
    org.set({
      rules: {
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
        catalogs: ['Producto', 'Centro de venta', 'Canal']
      }
    })

    await org.save()
  }

  console.log(`${bulkOps.length} ops ==> ${moment().format()}`)
  console.log(`End ==>  ${moment().format()}`)

  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
