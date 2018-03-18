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

    let defaultRole = await Role.findOne({isDefault: true})
    if (!defaultRole) {
      defaultRole = await Role.create({
        name: 'Default',
        slug: 'default',
        description: 'Default role',
        isDefault: true
      })
    }

    user.role = defaultRole
    user.save()

    const token = await user.createToken({
      type: 'session'
    })

    ctx.body = {
      user: user.toPublic(),
      jwt: token.getJwt()
    }
  }
})
