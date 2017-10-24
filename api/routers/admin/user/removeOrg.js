const Route = require('lib/router/route')
const {Organization, User, Role} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/:uuid/remove/organization',
  handler: async function (ctx) {
    const userId = ctx.params.uuid

    const user = await User.findOne({'uuid': userId})
    ctx.assert(user, 404, 'User not found')

    var orgData = ctx.request.body

    const org = await Organization.findOne({'uuid': orgData.organization})
    ctx.assert(org, 404, 'Organization not found')

    const role = await Role.findOne({'uuid': orgData.role})
    ctx.assert(org, 404, 'Role not found')

    var pos = user.organizations.findIndex(e => {
      return (
        String(e.organization) === String(org._id) &&
        String(e.role) === String(role._id)
      )
    })
    user.organizations.splice(pos, 1)
    user.save()

    ctx.body = {
      data: user.toAdmin()
    }
  }
})
