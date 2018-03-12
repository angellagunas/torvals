const Route = require('lib/router/route')
const {Group, User} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/:uuid/add/group',
  handler: async function (ctx) {
    const userId = ctx.params.uuid

    const user = await User.findOne({'uuid': userId})
    ctx.assert(user, 404, 'Usuario no encontrado')

    const group = await Group.findOne({'uuid': ctx.request.body.group})
    ctx.assert(group, 404, 'Grupo no encontrado')

    if (user.groups.find(item => { return String(item) === String(group._id) })) {
      ctx.throw(group, 400, 'Solamente se puede agregar al usuario a un grupo')
    }

    user.groups.push(group)
    await user.save()

    group.users.push(user)
    await group.save()

    ctx.body = {
      data: user.toPublic()
    }
  }
})
