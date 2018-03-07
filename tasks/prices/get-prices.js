// node tasks/prices/get-prices.js
require('../../config')
require('lib/databases/mongo')

const Api = require('lib/abraxas/api')
const Task = require('lib/task')
const { Price, Product, Channel } = require('models')
const request = require('lib/request')
const moment = require('moment')

const task = new Task(async function (argv) {
  console.log('Fetching Prices ...')

  console.log('Obtaining Abraxas API token ...')
  await Api.fetch()
  const apiData = Api.get()

  var options = {
    url: `${apiData.hostname}${apiData.baseUrl}/prices/organizations/all`,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${apiData.token}`
    },
    body: {},
    json: true,
    persist: true
  }

  var res = await request(options)

  for (var p of res._items) {
    var price = await Price.findOne({externalId: p._id})
    // check product id
    var product = await Product.findOne({externalId: p.producto_id})
    if (!product) { product = {_id: null} }
    var channel = await Channel.findOne({externalId: p.canal_id})
    if (!channel) { channel = {_id: null} }

    if (!price) {
      await Price.create({
        price: p.price,
        externalId: p._id,
        product: product._id,
        productExternalId: p.producto_id,
        channel: channel._id,
        channelExternalId: p.canal_id,
        etag: p._etag,
        dateCreated: moment.unix(p._created).utc()
      })
    } else {
      price.set({
        price: p.price,
        externalId: p._id,
        product: product._id,
        productExternalId: p.producto_id,
        channel: channel._id,
        channelExternalId: p.canal_id,
        etag: p._etag,
        dateCreated: moment.unix(p._created).utc()
      })
      await price.save()
    }
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
