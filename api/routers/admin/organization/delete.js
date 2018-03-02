const Route = require('lib/router/route')

const {Organization, User} = require('models')

module.exports = new Route({
  method: 'delete',
  path: '/:uuid',
  handler: async function (ctx) {
    var organizationId = ctx.params.uuid

    var org = await Organization.findOne({'uuid': organizationId})
    ctx.assert(org, 404, 'Organización no encontrada')

    org.set({isDeleted: true})
    org.save()

    var users = await User.find({'organizations.organization': { $in: [org._id] }})

    for (var user of users) {
      var pos = user.organizations.findIndex(e => {
        return (
          String(e.organization) === String(org._id)
        )
      })

      user.organizations.splice(pos, 1)
      await user.save()
    }

    ctx.body = {
      data: org.format()
    }
  }
})
