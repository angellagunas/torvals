// node tasks/dmigrations/migrate-organization-businessrules.js
require('../../config')
require('lib/databases/mongo')
const moment = require('moment')
const fs = require('fs')

const Task = require('lib/task')
const { Organization, Catalog, Price, CatalogItem } = require('models')

const task = new Task(async function (argv) {
  console.log(`Start ==>  ${moment().format()}`)

  console.log('Fetching Organizations...')
  const org = await Organization.findOne({slug: 'barcel'})

  if (!org) return false
  let productCatalog = await Catalog.findOne({slug: 'producto', organization: org._id})
  let channelCatalog = await Catalog.findOne({slug: 'canal', organization: org._id})

  console.log('Loading data from file ....')
  const saveFile = fs.readFileSync(
    argv.file,
    'utf8'
  )
  let data = JSON.parse(saveFile)

  for (let d of data._items) {
    let newProduct = await CatalogItem.findOne({
      catalog: productCatalog,
      externalId: String(d.producto_id),
      organization: org
    })

    if (!newProduct) {
      newProduct = await CatalogItem.create({
        name: 'Not Identified',
        externalId: d.producto_id,
        type: productCatalog.slug,
        catalog: productCatalog,
        organization: org._id,
        isNewExternal: true
      })
    }

    let newChannel = await CatalogItem.findOne({
      catalog: channelCatalog,
      externalId: String(d.canal_id),
      organization: org
    })

    if (!newChannel) {
      newChannel = await CatalogItem.create({
        name: 'Not Identified',
        externalId: d.canal_id,
        type: channelCatalog.slug,
        catalog: channelCatalog,
        organization: org._id,
        isNewExternal: true
      })
    }

    await Price.create({
      price: d.price,
      product: newProduct,
      catalogItems: [newChannel],
      organization: org._id
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
