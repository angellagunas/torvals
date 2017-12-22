const Route = require('lib/router/route')
const {SalesCenter} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/deleted',
  handler: async function (ctx) {
    var salesCenters = await SalesCenter.dataTables({
      limit: ctx.request.query.limit || 20,
      skip: ctx.request.query.start,
      find: {isDeleted: true},
      sort: ctx.request.query.sort || '-dateCreated',
      populate: 'organization'
    })

    ctx.body = salesCenters
  }
})
