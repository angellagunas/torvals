const ObjectId = require('mongodb').ObjectID
const Route = require('lib/router/route')

const {Channel, Organization} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/',
  handler: async function (ctx) {
    var filters = {}

    for (var filter in ctx.request.query) {
      if (filter === 'limit' || filter === 'start' || filter === 'sort') {
        continue
      }
      if (filter === 'organization') {
        const organization = await Organization.findOne(
          {'uuid': ctx.request.query[filter]}
        )

        if (organization) {
          filters['organization'] = ObjectId(organization._id)
        }
        continue
      }
      filters[filter] = { '$regex': ctx.request.query[filter], '$options': 'i' }
    }
    var channels = await Channel.dataTables({
      limit: ctx.request.query.limit || 20,
      skip: ctx.request.query.start,
      find: {...filters, isDeleted: false},
      sort: ctx.request.query.sort || '-dateCreated',
      populate: 'organization'
    })

    ctx.body = channels
  }
})
