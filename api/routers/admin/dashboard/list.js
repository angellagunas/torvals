const ObjectId = require('mongodb').ObjectID
const Route = require('lib/router/route')

const {Organization, User, Role, Group} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/',
  handler: async function (ctx) {
var organizationId = ctx.params.uuid

    const orgsCount = await Organization.count()
    const usersCount = await User.count()
    const rolesCount = await Role.count()
    const groupsCount = await Group.count()

    ctx.body = {
      orgsCount: orgsCount,
      usersCount: usersCount,
      rolesCount: rolesCount,
      groupsCount: groupsCount
    }
  }
})
