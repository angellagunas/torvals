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
  path: '/filtercheck/:uuid',
  handler: async function (ctx) {
    const datasetId = ctx.params.uuid

    const dataset = await DataSet.findOne({
      'uuid': datasetId,
      'isDeleted': false,
      organization: ctx.state.organization
    }).populate('catalogItems rule')

    ctx.assert(dataset, 404, 'DataSet no encontrado')

    await dataset.rule.populate('catalogs').execPopulate()

    let catalogs = dataset.rule.catalogs
    const user = ctx.state.user
    let currentRole

    const currentOrganization = user.organizations.find(orgRel => {
      return ctx.state.organization._id.equals(orgRel.organization._id)
    })

    if (currentOrganization) {
      const role = await Role.findOne({_id: currentOrganization.role})

      currentRole = role.toPublic()
    }

    let query = {}

    let filters = {}
    let res = []
    let rows = null

    for (i=0; i< ctx.request.query.numberChannels; i++)
    {
      query = {
        cycle: ctx.request.query['cycle'],
        'centro-de-venta': ctx.request.query['centro-de-venta'],
        canal: ctx.request.query['canales['+i+']']
      }

      rows = await consultfilter(query, currentRole, catalogs, user, dataset)
      
      res.push({
        uuid: ctx.request.query['canales['+i+']'],
        count: rows
      })
    }

    ctx.body = {
      dataCount: res
    }
  }
})

async function consultfilter(query, currentRole, catalogs, user, dataset){
  let catalogItemsFilters = []
  let filters = {}
      
  for (var filter in query) {
    filter_skip = ['limit', 'start', 'sort', 'date_start', 'date_end']
    if (filter_skip.includes(filter)) {
      continue
    }

    if (filter === 'cycle') {
      const cycles = await Cycle.find({uuid: {$in: query[filter]}})
      filters['cycle'] = { $in: cycles.map(item => { return item._id }) }
      continue
    }

    let isCatalog = catalogs.find(item => {
      return item.slug === filter
    })

    if (isCatalog) {
      const cItem = await CatalogItem.findOne({uuid: query[filter]})
      try{
        catalogItemsFilters.push(cItem.id)
      }catch(e){
        console.info(e)
        console.info(filter)
        console.info(query[filter])
        continue
      }
      continue
    }

    if (!isNaN(parseInt(query[filter]))) {
      filters[filter] = parseInt(query[filter])
    } else {
      filters[filter] = query[filter]
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

  return await DataSetRow.find({isDeleted: false, ...filters})
  .count()
}

