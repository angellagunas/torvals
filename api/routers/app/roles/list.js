const Route = require('lib/router/route')
const { Role } = require('models')

module.exports = new Route({
  method: 'get',
  path: '/',
  handler: async function (ctx) {
    var filters = {}
    for (var filter in ctx.request.query) {
      if (filter === 'limit' || filter === 'start' || filter === 'sort') {
        continue
      }

      if (filter === 'general') {
        filters['$or'] = [
          {name: new RegExp(ctx.request.query[filter], 'i')},
          {$where : `/^${ctx.request.query[filter]}.*/.test(this.priority)` }
        ]
      } else if (!isNaN(parseInt(ctx.request.query[filter]))) {
        filters[filter] = parseInt(ctx.request.query[filter])
      } else {
        filters[filter] = ctx.request.query[filter]
      }
    }

    let user = ctx.state.user
    var currentRole
    var currentOrganization
    if (ctx.state.organization) {
      currentOrganization = user.organizations.find(orgRel => {
        return ctx.state.organization._id.equals(orgRel.organization._id)
      })
      if (currentOrganization) {
        const role = await Role.findOne({_id: currentOrganization.role})

        currentRole = role.toPublic()
      }
    }

    if (currentRole.slug !== 'consultor-level-3' && currentRole.slug !== 'consultor-level-2') {
      filters['priority'] = { $gt: currentRole.priority }
    }

    var role = await Role.dataTables({
      limit: ctx.request.query.limit || 20,
      skip: ctx.request.query.start || 0,
      find: {isDeleted: false, ...filters},
      sort: ctx.request.query.sort || 'priority'
    })

    ctx.body = role
  }
})
