const Route = require('lib/router/route')
const {User} = require('models')
const jwt = require('lib/jwt')

module.exports = new Route({
  method: 'post',
  path: '/login',
  handler: async function (ctx) {
    const { email, password } = ctx.request.body
    const user = await User.auth(email, password)

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
