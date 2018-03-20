const Route = require('lib/router/route')
const {Group, User} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/:uuid/remove/group',
  handler: async function (ctx) {
    const userId = ctx.params.uuid

    const user = await User.findOne({'uuid': userId})
    ctx.assert(user, 404, 'Usuario no encontrado')

    const group = await Group.findOne({'uuid': ctx.request.body.group})
    ctx.assert(group, 404, 'Grupo no encontrado')

    var pos = user.groups.indexOf(group._id)
    user.groups.splice(pos, 1)
    user.save()

    pos = group.users.indexOf(user._id)
    group.users.splice(pos, 1)
    await group.save()

    ctx.body = {
      data: user.toAdmin()
    }
  }
})
