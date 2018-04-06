// node tasks/prices/get-prices.js --uuid uuid
// uuid organization
require('../../config')
require('lib/databases/mongo')

const Api = require('lib/abraxas/api')
const Task = require('lib/task')
const { Price, Product, Channel, Organization } = require('models')

const task = new Task(async function (argv) {
  const organization = await Organization.findOne({uuid: argv.uuid})
  if (!organization) {
    console.log('Error: Organization not found')
    return false
  }
  console.log('Fetching Prices ...')

  try {
    var res = await Api.getPrices()
  } catch (e) {
    console.log('error' + e.message)
    return false
  }

  for (var p of res._items) {
    var price = await Price.findOne({externalId: p._id})
    var product = await Product.findOne({externalId: p.producto_id})
    if (!product) {
      product = await Product.create({
        name: 'Not identified',
        externalId: p.producto_id,
        organization: organization._id,
        isNewExternal: true
      })
    }
    var channel = await Channel.findOne({externalId: p.canal_id})
    if (!channel) { channel = {_id: null} }

    if (!price) {
      price = await Price.create({
        price: p.price,
        externalId: p._id,
        product: product._id,
        productExternalId: p.producto_id,
        channel: channel._id,
        channelExternalId: p.canal_id,
        organization: organization._id,
        etag: p._etag
      })
    } else {
      price.set({
        price: p.price,
        externalId: p._id,
        product: product._id,
        productExternalId: p.producto_id,
        channel: channel._id,
        channelExternalId: p.canal_id,
        organization: organization._id,
        etag: p._etag
      })
      await price.save()
    }

    product.price = price
    await product.save()
  }

  console.log(`Received ${res._items.length} prices!`)
  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
