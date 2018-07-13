const Route = require('lib/router/route')
const { Price, CatalogItem, Role } = require('models')

module.exports = new Route({
  method: 'get',
  path: '/',
  handler: async function (ctx) {
    var filters = {}

    for (var filter in ctx.request.query) {
      if (filter === 'limit' || filter === 'start' || filter === 'sort') {
        continue
      }
      if (filter === 'general' && ctx.request.query[filter]) {
        let $or = []
        if (!isNaN(ctx.request.query[filter])) {
          $or.push({price: ctx.request.query[filter]})
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

    if (
      currentRole.slug === 'manager-level-1' ||
      currentRole.slug === 'manager-level-2' ||
      currentRole.slug === 'consultor-level-2' ||
      currentRole.slug === 'consultor-level-3' ||
      currentRole.slug === 'manager-level-3'
    ) {
      let catalogItems = await CatalogItem.filterByUserRole(
        { },
        currentRole.slug,
        user
      )
      filters['catalogItems'] = { '$in': catalogItems }
    }

    var prices = await Price.dataTables({
      limit: ctx.request.query.limit || 20,
      skip: ctx.request.query.start,
      find: {isDeleted: false, ...filters, organization: ctx.state.organization},
      sort: ctx.request.query.sort || '-dateCreated',
      populate: ['catalogItems', 'product']
    })

    prices.data = prices.data.map((price) => { return price.toPublic() })

    ctx.body = prices
  }
})
