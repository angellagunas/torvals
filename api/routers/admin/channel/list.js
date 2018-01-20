// const ObjectId = require('mongodb').ObjectID
const Route = require('lib/router/route')

const {Channel} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/',
  handler: async function (ctx) {
    // var filters = {}
    // for (var filter in ctx.request.query) {
    // }
    var channels = await Channel.dataTables({
      limit: ctx.request.query.limit || 20,
      skip: ctx.request.query.start,
      find: {isDeleted: false},
      sort: ctx.request.query.sort || '-dateCreated'
    })

    ctx.body = channels
  }
})
