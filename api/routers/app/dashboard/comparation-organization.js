const ObjectId = require('mongodb').ObjectID
const Route = require('lib/router/route')
const Api = require('lib/abraxas/api')

const { Project, Channel, SalesCenter, Product } = require('models')

module.exports = new Route({
  method: 'post',
  path: '/comparation/organization',
  handler: async function (ctx) {
    var data = ctx.request.body

    const requestBody = {
      date_start: data.date_start,
      date_end: data.date_end
    }

    if (data.channels) {
      var channels = await Channel.find({'uuid': {$in: data.channels}})
      var channelsExternal
      if (channels.length > 1) {
        for (let channel of channels) {
          channelsExternal.push(channel.externalId)
        }
      } else {
        channelsExternal = channels[0].externalId
      }

      requestBody['canal_id'] = channelsExternal
    }

    if (data.salesCenters) {
      var salescenters = await SalesCenter.find({'uuid': {$in: data.salesCenters}})
      var salescentersExternal
      if (salescenters.length > 1) {
        for (let salescenter of salescenters) {
          salescentersExternal.push(salescenter.externalId)
        }
      } else {
        salescentersExternal = salescenters[0].externalId
      }

      requestBody['agencia_id'] = salescentersExternal
    }

    if (data.products) {
      var products = await Product.find({'uuid': {$in: data.products}})
      var productsExternal = []
      if (salescenters.length > 1) {
        for (let product of products) {
          productsExternal.push(product.externalId)
        }
      } else {
        productsExternal = products[0].externalId
      }
      requestBody['producto_id'] = productsExternal
    }

    var responseData = await Api.comparationOrganization(ctx.state.organization.uuid, requestBody)

    ctx.body = responseData
  }
})
