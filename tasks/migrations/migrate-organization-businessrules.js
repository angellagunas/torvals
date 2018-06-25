// node tasks/dmigrations/migrate-organization-businessrules.js
require('../../config')
require('lib/databases/mongo')
const moment = require('moment')

const Task = require('lib/task')
const { Organization, Rule, Catalog } = require('models')

const task = new Task(async function (argv) {
  console.log(`Start ==>  ${moment().format()}`)
  let bulkOps = []

  console.log('Fetching Organizations...')
  const organizations = await Organization.find({})

  let catalogs = [{
    name: 'Producto',
    slug: 'producto'
  }, {
    name: 'Centro de venta',
    slug: 'centro-de-venta'
  }, {
    name: 'Canal',
    slug: 'canal'
  }]

  let rules = {
    startDate: moment().startOf('year').utc().format('YYYY-MM-DD'),
    cycleDuration: 1,
    cycle: 'M',
    period: 'w',
    periodDuration: 1,
    season: 12,
    cyclesAvailable: 6,
    takeStart: true,
    consolidation: 8,
    forecastCreation: 3,
    rangeAdjustmentRequest: 6,
    rangeAdjustment: 10,
    salesUpload: 3,
    ranges: [0, 0, 10, 20, 30, null]
  }

  for (let org of organizations) {
    let currentCatalogs = []

    for (let catalog of catalogs) {
      let newCatalog = await Catalog.create({
        organization: org._id,
        name: catalog.name,
        slug: catalog.slug,
        isDeleted: false
      })
      currentCatalogs.push(newCatalog)
    }
    await Rule.create({
      ...rules,
      catalogs: currentCatalogs,
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
