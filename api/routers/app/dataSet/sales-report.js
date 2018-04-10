const Route = require('lib/router/route')
const { DataSet, SalesCenter, Channel, Product, DataSetRow, Role } = require('models')
const Api = require('lib/abraxas/api')

module.exports = new Route({
  method: 'post',
  path: '/sales/:uuid',
  handler: async function (ctx) {
    var data = ctx.request.body
    const dataset = await DataSet.findOne({uuid: ctx.params.uuid})
    ctx.assert(dataset, 404, 'Dataset no encontrado')

    const requestQuery = {}

    const user = ctx.state.user
    var currentRole
    const currentOrganization = user.organizations.find(orgRel => {
      return ctx.state.organization._id.equals(orgRel.organization._id)
    })

    if (currentOrganization) {
      const role = await Role.findOne({_id: currentOrganization.role})

      currentRole = role.toPublic()
    }

    if (data.salesCenter) {
      const salesCenter = await SalesCenter.findOne({uuid: data.salesCenter})
      ctx.assert(salesCenter, 404, 'Centro de ventas no encontrado')
      requestQuery['agencia_id'] = salesCenter.externalId
    }

    if (
      (currentRole.slug === 'manager-level-1' ||
      currentRole.slug === 'manager-level-2') &&
      !data.salesCenters
    ) {
      var groups = user.groups
      var salesCenters = []

      salesCenters = await SalesCenter.find({groups: {$in: groups}})

      if (salesCenters.length > 0) {
        requestQuery['agencia_id'] = salesCenters[0].externalId
      } else {
        ctx.throw(400, 'Se le debe asignar al menos un centro de venta al usuario!')
      }
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

    var res = await Api.revenueDataset(dataset.externalId, whereQuery)

    for (var item of res._items) {
      const rows = await DataSetRow.find({
        'data.semanaBimbo': item.week,
        dataset: dataset
      }).populate('product')
      let difference = 0

      for (var row of rows) {
        await row.product.populate('price').execPopulate()

        if (row.product && row.product.price) {
          difference += (row.data.localAdjustment - row.data.adjustment) * row.product.price.price
        }
      }

      item.adjustment += difference
    }

    ctx.body = {
      data: res
    }
  }
})
