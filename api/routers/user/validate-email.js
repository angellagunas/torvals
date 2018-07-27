const Route = require('lib/router/route')
const lov = require('lov')

const {User} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/validate',
  validator: lov.object().keys({
    email: lov.string().email().required()
  }),
  handler: async function (ctx) {
    const { email } = ctx.request.body
    const user = await User.findOne({email: email})

    if (user) {
      ctx.throw(400, 'User exists')
    }

    ctx.body = {
      status: 'OK'
    }
  }
})
