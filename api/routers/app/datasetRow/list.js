const moment = require('moment')
const Route = require('lib/router/route')
const {
  DataSetRow,
  DataSet,
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

    let start = moment(ctx.request.query.date_start, 'YYYY-MM-DD').utc()
    let end = moment(ctx.request.query.date_end, 'YYYY-MM-DD').utc()

    let filters = {}
    for (var filter in ctx.request.query) {
      filter_skip = ['limit', 'start', 'sort', 'date_start', 'date_end']
      if (filter_skip.includes(filter)) {
        continue
      }

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
        try{
          catalogItemsFilters.push(cItem.id)
        }catch(e){
          console.info(e)
          console.info(filter)
          console.info(ctx.request.query[filter])
          continue
        }
        continue
      }

      if (!isNaN(parseInt(ctx.request.query[filter]))) {
        filters[filter] = parseInt(ctx.request.query[filter])
      } else {
        filters[filter] = ctx.request.query[filter]
      }
    }

    if (catalogItemsFilters.length > 0) {
      let catalogItems = await CatalogItem.filterByUserRole(
        { _id: { $in: catalogItemsFilters } },
        currentRole.slug,
        user
      )
      filters['catalogItems'] = { '$all': catalogItems }
    }

    filters['dataset'] = dataset._id

    const permissionsList = [
      'manager-level-1',
      'manager-level-2',
      'manager-level-3',
      'consultor-level-2',
      'consultor-level-3'
    ]
    if (permissionsList.includes(currentRole.slug)) {
      if (catalogItemsFilters.length === 0) {
        let catalogItems = await CatalogItem.filterByUserRole(
          { },
          currentRole.slug,
          user
        )
        filters['catalogItems'] = { '$in': catalogItems }
      }
    }

    var rows = await DataSetRow.find({isDeleted: false, ...filters})
    .populate(['adjustmentRequest', 'newProduct', 'period', 'catalogItems'])
    .sort(ctx.request.query.sort || '-dateCreated')

    const AllPrices = await Price.find({'organization': ctx.state.organization._id})
    var prices = {}
    for (let price of AllPrices) {
      prices[price.product] = price.price
    }

    var auxRows = []
    for (let item of rows) {
      for (let catalogItem of item.catalogItems) {
        await catalogItem.populate({
          path: 'catalog',
          options: { sort: { '_id': -1 } }
        }).execPopulate()
      }
      auxRows.push({
        uuid: item.uuid,
        productId: item.newProduct ? item.newProduct.externalId : '',
        productName: item.newProduct ? item.newProduct.name : '',
        productPrice: item.newProduct ? prices[item.newProduct._id] : '',
        period: item.period,
        prediction: item.data.prediction,
        adjustment: item.data.adjustment,
        localAdjustment: item.data.localAdjustment,
        lastAdjustment: item.data.lastAdjustment,
        adjustmentRequest: item.adjustmentRequest,
        externalId: item.externalId,
        catalogItems: item.catalogItems,
        csvData: Array.isArray(item.apiData) ? item.apiData[0] : item.apiData
      })
    }

    ctx.body = {
      data: auxRows
    }
  }
})
