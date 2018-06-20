const Route = require('lib/router/route')
const { CatalogItem, Catalog, Role } = require('models')

module.exports = new Route({
  method: 'get',
  path: '/:type',
  handler: async function (ctx) {
    const type = ctx.params.type
    var filters = {}

    for (var filter in ctx.request.query) {
      if (filter === 'limit' || filter === 'start' || filter === 'sort') {
        continue
      }

      if (!isNaN(parseInt(ctx.request.query[filter]))) {
        filters[filter] = parseInt(ctx.request.query[filter])
      } else if (filter === 'general') {
        continue
      } else {
        filters[filter] = ctx.request.query[filter]
      }
    }

    const organization = ctx.state.organization._id
    const catalog = await Catalog.findOne({
      slug: type,
      organization: organization,
      isDeleted: false
    })

    const user = ctx.state.user
    var currentRole
    const currentOrganization = user.organizations.find(orgRel => {
      return ctx.state.organization._id.equals(orgRel.organization._id)
    })

    if (currentOrganization) {
      const role = await Role.findOne({_id: currentOrganization.role})

      currentRole = role.toPublic()
    }

    if (type !== 'producto') {
      if (
          currentRole.slug === 'manager-level-1' ||
          currentRole.slug === 'manager-level-2' ||
          currentRole.slug === 'consultor-level-2' ||
          currentRole.slug === 'consultor-level-3' ||
          currentRole.slug === 'manager-level-3'
      ) {
        var groups = user.groups

        filters['groups'] = {$elemMatch: { '$in': groups }}
      }
    }

    var catalogItem = await CatalogItem.dataTables({
      limit: ctx.request.query.limit || 20,
      skip: ctx.request.query.start,
      find: {
        catalog: catalog._id,
        organization: organization,
        isDeleted: false,
        ...filters
      },
      sort: ctx.request.query.sort || '-dateCreated',
      populate: 'organization catalog'
    })

    catalogItem.data = catalogItem.data.map(item => {
      return item.toPublic()
    })

    ctx.body = catalogItem
  }
})
