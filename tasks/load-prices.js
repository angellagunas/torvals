// node tasks/dmigrations/migrate-organization-businessrules.js
require('../config')
require('lib/databases/mongo')
const moment = require('moment')
const fs = require('fs')
const parse = require('csv-parse/lib/sync')

const Task = require('lib/task')
const { Organization, Price, CatalogItem, Rule } = require('models')

const task = new Task(async function (argv) {
  console.log(`Start ==>  ${moment().format()}`)

  console.log('Fetching Organizations...')
  if (!argv.org) {
    console.log('You need to provide an Organization slug!')
    return false
  }

  if (!argv.file) {
    console.log('You need to provide a file!')
    return false
  }

  const org = await Organization.findOne({slug: argv.org})

  if (!org) {
    console.log("Organization doesn't exist!")
    return false
  }

  let rule = await Rule.findOne({organization: org, isCurrent: true}).populate('catalogs')
  let catalogs = rule.catalogs
  let productCatalog = catalogs.find(item => { return item.slug === 'producto' })

  console.log('Loading data from file ....')
  const saveFile = fs.readFileSync(
    argv.file,
    'utf8'
  )
  let data = parse(saveFile, {columns: true})
  let lastId

  for (let d of data) {
    if (d.producto_id === lastId) continue

    lastId = d.producto_id

    let newProduct = await CatalogItem.findOne({
      catalog: productCatalog._id,
      externalId: String(d.producto_id),
      organization: org
    })

    if (!newProduct) {
      newProduct = await CatalogItem.create({
        name: d.producto_name ? d.producto_name : 'Not identified',
        externalId: d.producto_id,
        type: productCatalog.slug,
        catalog: productCatalog._id,
        organization: org._id,
        isNewExternal: true
      })
    }

    let price = await Price.findOne({
      product: newProduct,
      organization: org._id
    })

    if (!price) {
      await Price.create({
        price: parseFloat(d.price),
        product: newProduct,
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
