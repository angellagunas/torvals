const Route = require('lib/router/route')
const { DataSet, SalesCenter, Channel, Product, DataSetRow, Role, Cycle, Period } = require('models')

module.exports = new Route({
  method: 'post',
  path: '/sales/:uuid',
  handler: async function (ctx) {
    var data = ctx.request.body
    const dataset = await DataSet.findOne({uuid: ctx.params.uuid})
    ctx.assert(dataset, 404, 'Dataset no encontrado')

    const user = ctx.state.user
    var currentRole
    const currentOrganization = user.organizations.find(orgRel => {
      return ctx.state.organization._id.equals(orgRel.organization._id)
    })

    if (currentOrganization) {
      const role = await Role.findOne({_id: currentOrganization.role})

      currentRole = role.toPublic()
    }

    var cycle = await Cycle.findOne({organization: currentOrganization._id, cycle: data.cycle})
    var periods = await Period.find({organization: currentOrganization._id, period: {$in: data.periods}, cycle: cycle._id})

    periods.ids = periods.map(item => {
      return item._id
    })

    var match = {
      'dataset': dataset._id,
      'data.adjustment': {
        '$ne': null
      },
      'data.prediction': {
        '$ne': null
      },
      'cycle': cycle._id,
      'period': {
        '$in': periods.ids
      }
    }

    if (data.salesCenter) {
      const salesCenter = await SalesCenter.findOne({uuid: data.salesCenter})
      ctx.assert(salesCenter, 404, 'Centro de ventas no encontrado')
      match['salesCenter'] = salesCenter._id
    }

    if (
      (currentRole.slug === 'manager-level-1' ||
      currentRole.slug === 'manager-level-2') &&
      !data.salesCenters
    ) {
      var groups = user.groups
      var salesCenters = []

      salesCenters = await SalesCenter.findOne({groups: {$in: groups}})

      if (salesCenters) {
        match['salesCenter'] = salesCenters._id
      } else {
        ctx.throw(400, '¡Se le debe asignar al menos un centro de venta al usuario!')
      }
    }

    if (data.channel) {
      const channel = await Channel.findOne({uuid: data.channel})
      ctx.assert(channel, 404, 'Canal no encontrado')
      match['channel'] = channel._id
    }

    if (data.product) {
      const product = await Product.findOne({uuid: data.product})
      ctx.assert(product, 404, 'Producto no encontrado')
      match['product'] = product._id
    }

    var statement = [
      {
        '$match': match
      },
      {
        '$lookup': {
          'from': 'products',
          'localField': 'product',
          'foreignField': '_id',
          'as': 'products'
        }
      },
      {
        '$unwind': {
          'path': '$products',
          'includeArrayIndex': 'arrayIndex',
          'preserveNullAndEmptyArrays': false
        }
      },
      {
        '$lookup': {
          'from': 'prices',
          'localField': 'products.price',
          'foreignField': '_id',
          'as': 'prices'
        }
      },
      {
        '$lookup': {
          'from': 'periods',
          'localField': 'period',
          'foreignField': '_id',
          'as': 'period'
        }
      },
      {
        '$unwind': {
          'path': '$prices',
          'includeArrayIndex': 'arrayIndex',
          'preserveNullAndEmptyArrays': false
        }
      },
      {
        '$group': {
          '_id': '$period.period',
          'prediction': {
            '$sum': {
              '$multiply': [
                '$data.prediction',
                '$prices.price'
              ]
            }
          },
          'adjustment': {
            '$sum': {
              '$multiply': [
                '$data.adjustment',
                '$prices.price'
              ]
            }
          }
        }
      },
      {
        '$project': {
          'period': '$_id',
          'prediction': 1,
          'adjustment': 1
        }
      },
      {
        '$sort': {
          'period': 1
        }
      }
    ]

    var res = await DataSetRow.aggregate(statement)

    ctx.body = {
      data: res
    }
  }
})
