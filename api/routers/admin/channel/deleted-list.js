const Route = require('lib/router/route')
const {Channel} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/deleted',
  handler: async function (ctx) {
    var channels = await Channel.dataTables({
      limit: ctx.request.query.limit || 20,
      skip: ctx.request.query.start,
      find: {isDeleted: true},
      sort: ctx.request.query.sort || '-dateCreated',
      populate: 'organization'
    })

    ctx.body = channels
  }
})
