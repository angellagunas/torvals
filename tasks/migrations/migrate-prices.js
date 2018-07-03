// node tasks/dmigrations/migrate-organization-businessrules.js
require('../../config')
require('lib/databases/mongo')
const moment = require('moment')
const fs = require('fs')

const Task = require('lib/task')
const { Organization, Price, CatalogItem, Rule } = require('models')

const task = new Task(async function (argv) {
  console.log(`Start ==>  ${moment().format()}`)

  console.log('Fetching Organizations...')
  const org = await Organization.findOne({slug: 'barcel'})

  if (!org) return false

  let rule = await Rule.findOne({organization: org, isCurrent: true}).populate('catalogs')
  let catalogs = rule.catalogs
  let productCatalog = catalogs.find(item => { return item.slug === 'producto' })
  let channelCatalog = catalogs.find(item => { return item.slug === 'canal' })

  console.log('Loading data from file ....')
  const saveFile = fs.readFileSync(
    argv.file,
    'utf8'
  )
  let data = JSON.parse(saveFile)

  for (let d of data._items) {
    let newProduct = await CatalogItem.findOne({
      catalog: productCatalog._id,
      externalId: String(d.producto_id),
      organization: org
    })

    if (!newProduct) {
      newProduct = await CatalogItem.create({
        name: 'Not Identified',
        externalId: d.producto_id,
        type: productCatalog.slug,
        catalog: productCatalog._id,
        organization: org._id,
        isNewExternal: true
      })
    }

    let newChannel = await CatalogItem.findOne({
      catalog: channelCatalog._id,
      externalId: String(d.canal_id),
      organization: org
    })

    if (!newChannel) {
      newChannel = await CatalogItem.create({
        name: 'Not Identified',
        externalId: d.canal_id,
        type: channelCatalog.slug,
        catalog: channelCatalog._id,
        organization: org._id,
        isNewExternal: true
      })
    }

    let price = await Price.findOne({
      product: newProduct,
      catalogItems: [newChannel],
      organization: org._id
    })

    if (!price) {
      await Price.create({
        price: d.price,
        product: newProduct,
        catalogItems: [newChannel],
        organization: org._id
      })
    } else {
      price.set({price: d.price})
      await price.save()
    }
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
