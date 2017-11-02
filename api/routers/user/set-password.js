const Route = require('lib/router/route')
const {User} = require('models')
const jwt = require('lib/jwt')
const lov = require('lov')

module.exports = new Route({
  method: 'post',
  path: '/set-password',
  validator: lov.object().keys({
    uuid: lov.string().required(),
    password: lov.string().required()
  }),
  handler: async function (ctx) {
    const { uuid, password } = ctx.request.body
    var user = await User.findOne({uuid: uuid})
    ctx.assert(user, 404, 'Invalid user!')

    user.set({password})
    await user.save()

    user = await User.auth(user.email, password)

    var orgsAux = user.organizations.map(item => {
      return {
        organization: item.organization.toPublic(),
        role: item.role
      }
    })

    var userPublic = user.toPublic()
    userPublic.organizations = orgsAux

    ctx.body = {
      user: userPublic,
      isAdmin: user.isAdmin,
      jwt: jwt.sign({
        uuid: user.uuid,
        apiToken: user.apiToken
      })
    }
  }
})
