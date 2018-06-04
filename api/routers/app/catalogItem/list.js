const Route = require('lib/router/route')
const {CatalogItem} = require('models')

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
      } else {
        filters[filter] = ctx.request.query[filter]
      }
    }

    const organization = ctx.state.organization._id

    var catalogItem = await CatalogItem.dataTables({
      limit: ctx.request.query.limit || 20,
      skip: ctx.request.query.start,
      find: {type: type, organization: organization, isDeleted: false, ...filters},
      sort: ctx.request.query.sort || '-dateCreated',
      populate: 'organization'
    })

    catalogItem.data = catalogItem.data.map(item => {
      return item.toPublic()
    })

    ctx.body = catalogItem.data
  }
})
