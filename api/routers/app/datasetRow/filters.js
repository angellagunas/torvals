const Route = require('lib/router/route')
const moment = require('moment')

const {
  DataSetRow,
  DataSet,
  CatalogItem,
  Role,
  Cycle
} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/filters/dataset/:uuid',
  handler: async function (ctx) {
    const datasetId = ctx.params.uuid
    let filters = {}

    const dataset = await DataSet.findOne({
      'uuid': datasetId,
      'isDeleted': false,
      organization: ctx.state.organization
    }).populate('rule')

    ctx.assert(dataset, 404, 'DataSet no encontrado')

    const user = ctx.state.user
    let currentRole
    const currentOrganization = user.organizations.find(orgRel => {
      return ctx.state.organization._id.equals(orgRel.organization._id)
    })

    if (currentOrganization) {
      const role = await Role.findOne({_id: currentOrganization.role})

      currentRole = role.toPublic()
    }

    const permissionsList = [
      'manager-level-1',
      'manager-level-2',
      'manager-level-3',
      'consultor-level-2',
      'consultor-level-3'
    ]
    if (permissionsList.includes(currentRole.slug)) {
      const groups = user.groups

      filters['groups'] = {$elemMatch: { '$in': groups }}
      filters['organization'] = currentOrganization.organization._id
    }

    let cycles = await DataSetRow.find({isDeleted: false, dataset: dataset}).distinct('cycle')
    let catalogItems = await DataSetRow.find({isDeleted: false, dataset: dataset}).distinct('catalogItems')

    cycles = await Cycle.find({
      organization: ctx.state.organization,
      rule: dataset.rule,
      dateStart: {$lte: moment.utc(dataset.dateMax), $gte: moment.utc(dataset.dateMin).subtract(1, 'days')}
    }).sort('-dateStart')

    cycles = cycles.map(item => {
      return {
        cycle: item.cycle,
        uuid: item.uuid,
        dateStart: item.dateStart,
        dateEnd: item.dateEnd
      }
    })

    catalogItems = await CatalogItem.find({ _id: { $in: catalogItems }, type: {$ne: 'producto'}, ...filters })

    await dataset.rule.populate('catalogs').execPopulate()

    let catalogs = dataset.rule.catalogs
    let catalogsResponse = []

    for (let catalog of catalogs) {
      catalogsResponse[catalog.slug] = []
    }

    for (let item of catalogItems) {
      await item.populate('catalog').execPopulate()
      if (!catalogsResponse[item.catalog.slug]) continue
      catalogsResponse[item.catalog.slug].push(item)
    }

    ctx.body = {
      cycles,
      ...catalogsResponse
    }
  }
})
