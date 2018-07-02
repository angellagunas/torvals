const Route = require('lib/router/route')
const lov = require('lov')

const { Organization } = require('models')

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

    const orgObject = await Organization.findOne({ uuid: organization})
    if (!orgObject) {
      return ctx.throw(403)
    }

    const token = await user.createToken({
      type: 'api',
      organization: orgObject._id,
      name
    })

    ctx.body = {
      token: token.toPrivate()
    }
  }
})
