const Route = require('lib/router/route')

const {Role, User} = require('models')

module.exports = new Route({
  method: 'delete',
  path: '/:uuid',
  handler: async function (ctx) {
    var roleId = ctx.params.uuid

    var role = await Role.findOne({'uuid': roleId}).populate('users')
    ctx.assert(role, 404, 'Role not found')

    if (!role.isDefault) {
      var defaultRole = await Role.findOne({isDefault: true})
      var users = await User.find({'organizations.role': { $in: [role._id] }})

      for (var user of users) {
        var pos = user.organizations.findIndex(e => {
          return (
            String(e.role) === String(role._id)
          )
        })

        var orgs = user.organizations[pos]
        orgs.role = defaultRole

        user.organizations.splice(pos, 1)
        user.organizations.push(orgs)
        await user.save()
      }

      role.set({
        isDeleted: true,
        users: []
      })

      await role.save()
    }

    ctx.body = {
      data: role.format()
    }
  }
})
