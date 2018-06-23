const Route = require('lib/router/route')
const {
  DataSetRow,
  DataSet,
  Product,
  SalesCenter,
  Channel,
  Role,
  Price,
  Period,
  Cycle,
  CatalogItem
} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/dataset/:uuid',
  handler: async function (ctx) {
    var datasetId = ctx.params.uuid

    const dataset = await DataSet.findOne({
      'uuid': datasetId,
      'isDeleted': false,
      organization: ctx.state.organization
    }).populate('catalogItems rule')

    ctx.assert(dataset, 404, 'DataSet no encontrado')

    await dataset.rule.populate('catalogs').execPopulate()

    let catalogs = dataset.rule.catalogs
    let catalogItemsFilters = []
    const user = ctx.state.user
    var currentRole

    const currentOrganization = user.organizations.find(orgRel => {
      return ctx.state.organization._id.equals(orgRel.organization._id)
    })

    if (currentOrganization) {
      const role = await Role.findOne({_id: currentOrganization.role})

      currentRole = role.toPublic()
    }

    let filters = {}
    for (var filter in ctx.request.query) {
      if (filter === 'limit' || filter === 'start' || filter === 'sort') {
        continue
      }

      if (filter === 'product') {
        // filters[filter] = await Product.findOne({
        //   'uuid': ctx.request.query[filter],
        //   organization: dataset.organization
        // })
        continue
      }

      if (filter === 'channel') {
        // filters[filter] = await Channel.findOne({
        //   'uuid': ctx.request.query[filter],
        //   organization: dataset.organization
        // })
        continue
      }

      if (filter === 'salesCenter') {
        // filters[filter] = await SalesCenter.findOne({
        //   'uuid': ctx.request.query[filter],
        //   organization: dataset.organization
        // })
        continue
      }

      // if (filter === 'category') {
      //   var products = await Product.find({
      //     'category': ctx.request.query[filter],
      //     organization: dataset.organization
      //   })
      //   filters['product'] = { $in: products.map(item => { return item._id }) }
      //   continue
      // }

      if (filter === 'period') {
        const periods = await Period.find({uuid: {$in: ctx.request.query[filter]}})
        filters['period'] = { $in: periods.map(item => { return item._id }) }
        continue
      }

      if (filter === 'cycle') {
        const cycles = await Cycle.find({uuid: {$in: ctx.request.query[filter]}})
        filters['cycle'] = { $in: cycles.map(item => { return item._id }) }
        continue
      }

      var isCatalog = catalogs.find(item => {
        return item.slug === filter
      })

      if (isCatalog) {
        const cItem = await CatalogItem.findOne({uuid: ctx.request.query[filter]})
        catalogItemsFilters.push(cItem.id)
        continue
      }

      if (!isNaN(parseInt(ctx.request.query[filter]))) {
        filters[filter] = parseInt(ctx.request.query[filter])
      } else {
        filters[filter] = ctx.request.query[filter]
      }
    }

    // const catalogItems = await CatalogItem.filterByUserRole(
    //   { uuid: { $in: data.catalogItems } },
    //   currentRole.slug,
    //   user
    // )
    // catalogItemsFilters = new Set(catalogItemsFilters)

    // for (let cItem of catalogItems) {
    //   catalogItemsFilters.add(cItem)
    // }

    if (catalogItemsFilters.length > 0) {
      let catalogItems = await CatalogItem.filterByUserRole(
        { _id: { $in: catalogItemsFilters } },
        currentRole.slug,
        user
      )
      filters['catalogItems'] = { '$all': catalogItems }
    }

    console.log(filters.catalogItems)

    filters['dataset'] = dataset._id

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
        filters['catalogItems'] = { '$in': catalogItems }
      }

      // if (!filters['salesCenter']) {
      //   var salesCenters = []

      //   salesCenters = await SalesCenter.find({
      //     groups: {$in: groups},
      //     organization: ctx.state.organization._id
      //   })

      //   filters['salesCenter'] = {$in: salesCenters}
      // }

      // if (!filters['channel']) {
      //   var channels = []

      //   channels = await Channel.find({
      //     groups: { $in: groups },
      //     organization: ctx.state.organization._id
      //   })

      //   filters['channel'] = {$in: channels}
      // }
    }

    console.log(filters)

    var rows = await DataSetRow.find({isDeleted: false, ...filters})
    .populate(['adjustmentRequest', 'product', 'period', 'catalogItems'])
    .sort(ctx.request.query.sort || '-dateCreated')

    const AllPrices = await Price.find({'organization': ctx.state.organization._id})
    var prices = {}
    for (let price of AllPrices) {
      prices[price._id] = price.price
    }

    // const AllProducts = await Product.find({'organization': ctx.state.organization._id})
    // var productsArr = []
    // for (let product of AllProducts) {
    //   productsArr[product._id] = {'name': product.name, 'externalId': product.externalId}
    // }

    var auxRows = []
    for (let item of rows) {
      for (let catalogItem of item.catalogItems) {
        await catalogItem.populate('catalog').execPopulate()
      }
      auxRows.push({
        uuid: item.uuid,
        productId: item.product ? item.product.externalId : '',
        productName: item.product ? item.product.name : '',
        productPrice: prices[item.product.price] || '',
        period: item.period,
        prediction: item.data.prediction,
        adjustment: item.data.adjustment,
        localAdjustment: item.data.localAdjustment,
        lastAdjustment: item.data.lastAdjustment,
        adjustmentRequest: item.adjustmentRequest,
        externalId: item.externalId,
        catalogItems: item.catalogItems
      })
    }

    ctx.body = {
      data: auxRows
    }
  }
})
