const Route = require('lib/router/route')

const {
  DataSetRow,
  DataSet,
  CatalogItem,
  Role
} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/modified/dataset/:uuid',
  handler: async function (ctx) {
    let datasetId = ctx.params.uuid
    const catalogIds = ctx.request.query.catalogIds.split(',')
    const dataset = await DataSet.findOne({'uuid': datasetId, 'isDeleted': false})

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

    let filters = {}
    filters['dataset'] = dataset
    filters['status'] = 'adjusted'
    filters['organization'] = ctx.state.organization

    const permissionsList = [
      'manager-level-1',
      'manager-level-2',
      'manager-level-3',
      'consultor-level-2',
      'consultor-level-3'
    ]
    if (permissionsList.includes(currentRole.slug)) {
      const catalogItems = await CatalogItem.filterByUserRole(
        { _id: {$in: catalogIds}, type: 'centro-de-venta'},
        currentRole.slug,
        user
      )
      filters['catalogItems'] = { '$in': catalogItems }
    }

    let modified = await DataSetRow.find({isDeleted: false, ...filters}).count()
    filters['status'] = 'sendingChanges'
    let pending = await DataSetRow.find({isDeleted: false, ...filters}).count()

    ctx.body = {
      data: {modified: modified, pending: pending}
    }
  }
})
