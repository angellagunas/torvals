const Route = require('lib/router/route')
const { Anomaly, Project, Role, CatalogItem, Period, Cycle } = require('models')

module.exports = new Route({
  method: 'get',
  path: '/list/:uuid',
  handler: async function (ctx) {
    var filters = {}
    const project = await Project.findOne({uuid: ctx.params.uuid}).populate('rule')

    ctx.assert(project, 404, 'Proyecto no encontrado')

    await project.rule.populate('catalogs').execPopulate()

    let catalogs = project.rule.catalogs
    let catalogItemsFilters = []

    for (var filter in ctx.request.query) {
      if (filter === 'limit' || filter === 'start' || filter === 'sort') {
        continue
      }

      if (filter === 'product') {
        filters['newProduct'] = await CatalogItem.findOne({
          'uuid': ctx.request.query[filter],
          organization: ctx.state.organization
        })
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
        catalogItemsFilters.push(cItem.id)
        continue
      }

      if (filter === 'requestId') {
        var requestId = ctx.request.query[filter]
        continue
      }

      if (filter === 'general') {
        let $or = []

        if (!isNaN(ctx.request.query[filter])) {
          $or.push({prediction: ctx.request.query[filter]})
        }

        let catalogItemsValues = []
        let catalogItems = await CatalogItem.find({
          $or: [
            {name: new RegExp(ctx.request.query[filter], 'i')},
            {externalId: new RegExp(ctx.request.query[filter], 'i')}
          ],
          isDeleted: false,
          organization: ctx.state.organization
        })
        catalogItems.map(item => {
          catalogItemsValues.push(item._id)
        })

        if (catalogItemsValues.length) {
          $or.push({catalogItems: {$in: catalogItemsValues}})
          $or.push({newProduct: {$in: catalogItemsValues}})
        }

        if ($or.length) { filters['$or'] = $or }
      } else {
        if (!isNaN(parseInt(ctx.request.query[filter]))) {
          filters[filter] = parseInt(ctx.request.query[filter])
        } else {
          filters[filter] = ctx.request.query[filter]
        }
      }
    }

    const user = ctx.state.user
    var currentRole
    const currentOrganization = user.organizations.find(orgRel => {
      return ctx.state.organization._id.equals(orgRel.organization._id)
    })

    if (currentOrganization) {
      const role = await Role.findOne({_id: currentOrganization.role})

      currentRole = role.toPublic()
    }

    if (catalogItemsFilters.length > 0) {
      let catalogItems = await CatalogItem.filterByUserRole(
        { _id: { $in: catalogItemsFilters } },
        currentRole.slug,
        user
      )
      filters['catalogItems'] = { '$all': catalogItems }
    }

    if (
      currentRole.slug === 'consultor-level-3' || currentRole.slug === 'manager-level-3'
    ) {
      if (catalogItemsFilters.length === 0) {
        let catalogItems = await CatalogItem.filterByUserRole(
          { _id: { $in: catalogItemsFilters } },
          currentRole.slug,
          user
        )
        filters['catalogItems'] = { '$in': catalogItems }
      }
    }

    var rows = await Anomaly.dataTables({
      limit: ctx.request.query.limit || 20,
      skip: ctx.request.query.start,
      find: {
        isDeleted: false,
        ...filters,
        organization: ctx.state.organization._id,
        project: project._id
      },
      sort: ctx.request.query.sort || '-dateCreated',
      populate: ['newProduct', 'organization', 'catalogItems']
    })

    rows.data = rows.data.map(item => {
      return {
        ...item.toPublic(),
        product: item.newProduct
      }
    })

    if (requestId) {
      rows['requestId'] = requestId
    }

    ctx.body = rows
  }
})
