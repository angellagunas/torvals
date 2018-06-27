const Route = require('lib/router/route')
const lov = require('lov')

module.exports = new Route({
  method: 'post',
  path: '/tokens',
  validator: lov.object().keys({
    name: lov.string().required()
  }),
  handler: async function (ctx) {
    const { user } = ctx.state
    const { name, organization } = ctx.request.body

    if (!user || !organization) {
      return ctx.throw(403)
    }

    if (ctx.state.authMethod !== 'Bearer') {
      return ctx.throw(403)
    }

    const token = await user.createToken({
      type: 'api',
      name,
      organization
    })

    ctx.body = {
      token: token.toPrivate()
    }
  }
})
