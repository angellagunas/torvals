// node tasks/datasetsRows/send-adjustment-datasetrows.js
require('../../config')
require('lib/databases/mongo')
const moment = require('moment')

const Task = require('lib/task')
const { Product, Channel, SalesCenter, CatalogItem } = require('models')

const task = new Task(async function (argv) {
  console.log(`Start ==>  ${moment().format()}`)
  let bulkOps = []

  console.log('Fetching Products...')
  const products = await Product.find({})

  for (let prod of products) {
    bulkOps.push({
      type: 'Producto',
      name: prod.name,
      externalId: prod.externalId,
      organization: prod.organization
    })
  }

  console.log('Fetching Sales Centers...')
  const salesCenters = await SalesCenter.find({})

  for (let sc of salesCenters) {
    bulkOps.push({
      type: 'Centro de venta',
      name: sc.name,
      externalId: sc.externalId,
      organization: sc.organization
    })
  }

  console.log('Fetching Channels...')
  const channels = await Channel.find({})

  for (let chan of channels) {
    bulkOps.push({
      type: 'Canal',
      name: chan.name,
      externalId: chan.externalId,
      organization: chan.organization
    })
  }

  await CatalogItem.insertMany(bulkOps)

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
