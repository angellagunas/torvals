const Route = require('lib/router/route')
const {User} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/login',
  handler: async function (ctx) {
    const { email, password } = ctx.request.body
    const user = await User.auth(email, password)

    if (user.isDeleted) {
      ctx.throw(404, 'User not found')
    }

    var orgsAux = user.organizations.map(item => {
      return {
        organization: item.organization.toPublic(),
        role: item.role
      }
    })

    var userPublic = user.toPublic()
    userPublic.organizations = orgsAux

    const token = await user.createToken({
      type: 'session'
    })

    ctx.body = {
      user: userPublic,
      isAdmin: user.isAdmin,
      jwt: token.getJwt()
    }
  }
})
