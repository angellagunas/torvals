const Route = require('lib/router/route')
const lov = require('lov')

module.exports = new Route({
  method: 'post',
  path: '/me/update',
  validator: lov.object().keys({
    email: lov.string().email().required(),
    name: lov.string().required(),
    uuid: lov.string()
  }),
  handler: async function (ctx) {
    const user = ctx.state.user

    if (!user) {
      return ctx.throw(403)
    }

    user.set(ctx.request.body)
    await user.save()

    ctx.body = {
      user: user.format(),
      data: 'OK'
    }
  }
})
