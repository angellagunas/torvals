const Route = require('lib/router/route')
const { DataSet, CatalogItem, DataSetRow, Role, Cycle, Period } = require('models')

module.exports = new Route({
  method: 'post',
  path: '/sales/:uuid',
  handler: async function (ctx) {
    var data = ctx.request.body
    console.log(data)
    const dataset = await DataSet.findOne({uuid: ctx.params.uuid}).populate('rule')
    ctx.assert(dataset, 404, 'Dataset no encontrado')

    const user = ctx.state.user
    await dataset.rule.populate('catalogs').execPopulate()

    let catalogs = dataset.rule.catalogs
    var currentRole
    const currentOrganization = user.organizations.find(orgRel => {
      return ctx.state.organization._id.equals(orgRel.organization._id)
    })

    if (currentOrganization) {
      const role = await Role.findOne({_id: currentOrganization.role})

      currentRole = role.toPublic()
    }
    var cycle = await Cycle.findOne({organization: ctx.state.organization, uuid: data.cycle})
    var periods = await Period.find({cycle: cycle._id})

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
      'period': {
        '$in': periods.ids
      }
    }

    let catalogItemsFilters = []

    for (let filter of Object.keys(data)) {
      var isCatalog = catalogs.find(item => {
        return item.slug === filter
      })

      if (isCatalog) {
        const cItem = await CatalogItem.findOne({uuid: data[filter]})
        catalogItemsFilters.push(cItem.id)
        continue
      }
    }

    if (catalogItemsFilters.length > 0) {
      let catalogItems = await CatalogItem.filterByUserRole(
        { _id: { $in: catalogItemsFilters } },
        currentRole.slug,
        user
      )
      match['catalogItems'] = { '$all': catalogItems }
    }

    if (
      currentRole.slug === 'manager-level-1' ||
      currentRole.slug === 'manager-level-2' ||
      currentRole.slug === 'consultor-level-2' ||
      currentRole.slug === 'consultor-level-3' ||
      currentRole.slug === 'manager-level-3'
    ) {
      if (catalogItemsFilters.length === 0) {
        let catalogItems = await CatalogItem.filterByUserRole(
            { _id: { $in: catalogItemsFilters } },
            currentRole.slug,
            user
          )
        match['catalogItems'] = { '$in': catalogItems }
      }
    }
    console.log(JSON.stringify(match))

    // if (data.salesCenter) {
    //   const salesCenter = await SalesCenter.findOne({uuid: data.salesCenter})
    //   ctx.assert(salesCenter, 404, 'Centro de ventas no encontrado')
    //   match['salesCenter'] = salesCenter._id
    // }

    // if (
    //   (
    //     currentRole.slug === 'manager-level-1' ||
    //     currentRole.slug === 'manager-level-2' ||
    //     currentRole.slug === 'consultor-level-2' ||
    //     currentRole.slug === 'consultor-level-3' ||
    //     currentRole.slug === 'manager-level-3'
    //   ) && !data.salesCenters
    // ) {
    //   var groups = user.groups
    //   var salesCenters = []

    //   salesCenters = await SalesCenter.findOne({groups: {$in: groups}})

    //   if (salesCenters) {
    //     match['salesCenter'] = salesCenters._id
    //   } else {
    //     ctx.throw(400, '¡Se le debe asignar al menos un centro de venta al usuario!')
    //   }
    // }

    // if (data.channel) {
    //   const channel = await Channel.findOne({uuid: data.channel})
    //   ctx.assert(channel, 404, 'Canal no encontrado')
    //   match['channel'] = channel._id
    // }

    // if (data.product) {
    //   const product = await Product.findOne({uuid: data.product})
    //   ctx.assert(product, 404, 'Producto no encontrado')
    //   match['product'] = product._id
    // }

    var statement = [
      {
        '$match': match
      },
      {
        '$lookup': {
          'from': 'catalogitems',
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
          'localField': 'products._id',
          'foreignField': 'product',
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
    console.log(res)

    ctx.body = {
      data: res
    }
  }
})
