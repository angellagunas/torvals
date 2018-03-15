const Route = require('lib/router/route')
const { DataSet, SalesCenter, Channel, Product, DataSetRow } = require('models')
const Api = require('lib/abraxas/api')
const request = require('lib/request')

module.exports = new Route({
  method: 'post',
  path: '/sales/:uuid',
  handler: async function (ctx) {
    var data = ctx.request.body
    const dataset = await DataSet.findOne({uuid: ctx.params.uuid})
    ctx.assert(dataset, 404, 'Dataset no encontrado')

    try {
      var apiData = Api.get()
      if (!apiData.token) {
        await Api.fetch()
        apiData = Api.get()
      }
    } catch (e) {
      ctx.throw(503, 'Abraxas API no disponible para la conexión')
    }

    const requestQuery = {}

    if (data.salesCenter) {
      const salesCenter = await SalesCenter.findOne({uuid: data.salesCenter})
      ctx.assert(salesCenter, 404, 'Centro de ventas no encontrado')
      requestQuery['agencia_id'] = salesCenter.externalId
    }

    if (data.channel) {
      const channel = await Channel.findOne({uuid: data.channel})
      ctx.assert(channel, 404, 'Canal no encontrado')
      requestQuery['canal_id'] = channel.externalId
    }

    if (data.product) {
      const product = await Product.findOne({uuid: data.product})
      ctx.assert(product, 404, 'Producto no encontrado')
      requestQuery['producto_id'] = data.product
    }

    if (data.semana_bimbo) {
      requestQuery['semana_bimbo'] = data.semana_bimbo
    }

    var whereQuery = ''
    if (requestQuery) { whereQuery = '?where=' + JSON.stringify(requestQuery) }

    var options = {
      url: `${apiData.hostname}${apiData.baseUrl}/revenue/datasets/${dataset.externalId}${whereQuery}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiData.token}`
      },
      json: true,
      persist: true
    }

    try {
      var res = await request(options)
    } catch (e) {
      let errorString = /<title>(.*?)<\/title>/g.exec(e.message)
      if (!errorString) {
        errorString = []
        errorString[1] = e.message
      }
      ctx.throw(503, 'Abraxas API: ' + errorString[1])

      return false
    }

    for (var item of res._items) {
      const rows = await DataSetRow.find({
        'data.semanaBimbo': item.week,
        dataset: dataset
      }).populate('product')
      let difference = 0

      for (var row of rows) {
        await row.product.populate('price').execPopulate()

        difference += (row.data.localAdjustment - row.data.adjustment) * row.product.price.price
      }

      item.adjustment += difference
    }

    ctx.body = {
      data: res
    }
  }
})
