const Route = require('lib/router/route')
const lov = require('lov')

const {User} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/:uuid',
  validator: lov.object().keys({
    name: lov.string().required(),
    email: lov.string().email().required()
  }),
  handler: async function (ctx) {
    var userId = ctx.params.uuid
    var data = ctx.request.body

    const user = await User.findOne({'uuid': userId})
    ctx.assert(user, 404, 'Usuario no encontrado')

    user.set({name: data.name, isAdmin: data.isAdmin})
    await user.save()

    ctx.body = {
      data: user.toPublic()
    }
  }
})
