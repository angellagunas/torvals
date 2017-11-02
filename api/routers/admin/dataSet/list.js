const ObjectId = require('mongodb').ObjectID
const Route = require('lib/router/route')
const {User, Organization, Role, Group, DataSet} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/',
  handler: async function (ctx) {
    /*var filters = {}
    for (var filter in ctx.request.query) {
      if (filter === 'limit' || filter === 'start') {
        continue
      }
      /*
      if (filter === 'role') {
        const role = await Role.findOne(
          {'uuid': ctx.request.query[filter]}
        )

        if (role) {
          filters['organizations.role'] = { $in: [ObjectId(role._id)] }
        }

        continue
      }

      if (filter === 'organization') {
        const organization = await Organization.findOne(
          {'uuid': ctx.request.query[filter]}
        )

        if (organization) {
          filters['organizations.organization'] = { $in: [ObjectId(organization._id)] }
        }

        continue
      }

      if (filter === 'group') {
        const group = await Group.findOne(
          {'uuid': ctx.request.query[filter]}
        )

        if (group) {
          filters['groups'] = { $in: [ObjectId(group._id)] }
        }

        continue
      }
      

      if (!isNaN(parseInt(ctx.request.query[filter]))) {
        filters[filter] = parseInt(ctx.request.query[filter])
      } else {
        filters[filter] = ctx.request.query[filter]
      }
    }

    var datasets = await DataSet.dataTables({
      limit: ctx.request.query.limit || 20,
      skip: ctx.request.query.start,
      find: filters,
      sort: 'name'
    })

    //datasets.data = datasets.data.map((user) => { return user.toAdmin() })

    ctx.body = datasets*/
    ctx.body = await DataSet.find({})
    console.log(ctx.body)
  }
})
