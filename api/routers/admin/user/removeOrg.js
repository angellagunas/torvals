const Route = require('lib/router/route')
const {Organization, User, Role} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/:uuid/remove/organization',
  handler: async function (ctx) {
    const userId = ctx.params.uuid

    const user = await User.findOne({'uuid': userId}).populate('groups')
    ctx.assert(user, 404, 'Usuario no encontrado')

    var orgData = ctx.request.body

    const org = await Organization.findOne({'uuid': orgData.organization})
    ctx.assert(org, 404, 'Organización no encontrada')

    const role = await Role.findOne({'uuid': orgData.role})
    ctx.assert(org, 404, 'Rol no encontrado')

    var pos = user.organizations.findIndex(e => {
      return (
        String(e.organization) === String(org._id) &&
        String(e.role) === String(role._id)
      )
    })
    user.organizations.splice(pos, 1)

    var groupsAux = []

    for (var group of user.groups) {
      if (String(group.organization) !== String(org._id)) {
        groupsAux.push(group)
      }
    }

    user.groups = groupsAux
    await user.save()

    ctx.body = {
      data: user.toAdmin()
    }
  }
})
