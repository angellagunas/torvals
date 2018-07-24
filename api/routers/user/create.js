const Route = require('lib/router/route')
const lov = require('lov')

const {User, Role} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/',
  validator: lov.object().keys({
    email: lov.string().email().required(),
    password: lov.string().required(),
    name: lov.string().required()
  }),
  handler: async function (ctx) {
    const { name, email, password } = ctx.request.body
    const user = await User.register({
      name,
      email,
      password
    })

    let defaultRole = await Role.findOne({slug: 'orgadmin'})

    user.role = defaultRole
    user.save()

    user.sendActivationEmail()

    const token = await user.createToken({
      type: 'session'
    })

    var data = user.toPublic()
    data['currentRole'] = defaultRole.toPublic()

    ctx.body = {
      user: data,
      jwt: token.getJwt()
    }
  }
})
