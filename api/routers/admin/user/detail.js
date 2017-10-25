const ObjectId = require('mongodb').ObjectID
const Route = require('lib/router/route')
const {User, Organization} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/:uuid',
  handler: async function (ctx) {
    const userId = ctx.params.uuid

    const user = await User.findOne({'uuid': userId})
      .populate('organizations.organization')
      .populate('organizations.role')
      .populate('groups')
      .populate('groups.organization')

    ctx.assert(user, 404, 'User not found')

    for (var group of user.groups) {
      group.organization = await Organization.findOne({'_id': ObjectId(group.organization)})
    }

    ctx.body = {
      data: user.toAdmin()
    }
  }
})
