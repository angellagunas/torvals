const Route = require('lib/router/route')
const lov = require('lov')

module.exports = new Route({
  method: 'post',
  path: '/me/update-password',
  validator: lov.object().keys({
    password: lov.string().required(),
    newPassword: lov.string().required(),
    confirmPassword: lov.string().required(),
    uuid: lov.string()
  }),
  handler: async function (ctx) {
    const user = ctx.state.user

    if (!user) {
      return ctx.throw(403, 'Forbidden')
    }

    const { password, newPassword, confirmPassword } = ctx.request.body

    if (confirmPassword !== newPassword) {
      ctx.throw(422, 'Los campos de password no coinciden')
    }

    if (await user.validatePassword(password)) {
      user.password = newPassword
      await user.save()
    } else {
      return ctx.throw(401, 'Password inválido')
    }

    ctx.body = {
      user: user.format(),
      data: 'OK'
    }
  }
})
