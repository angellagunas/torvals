const Route = require('lib/router/route')
const lov = require('lov')

module.exports = new Route({
  method: 'post',
  path: '/me/update',
  validator: lov.object().keys({
    email: lov.string().email().required(),
    name: lov.string().required(),
    job: lov.string(),
    language: lov.string(),
    phone: lov.string()
  }),
  handler: async function (ctx) {
    const user = ctx.state.user
    const data = ctx.request.body

    var file = ctx.request.body.profile

    if (file) {
      await user.uploadProfilePicture(file)
    }

    if (!user) {
      return ctx.throw(403)
    }

    user.set({
      email: data.email,
      name: data.name,
      job: data.job,
      language: data.language,
      phone: data.phone
    })
    await user.save()

    ctx.body = {
      user: user.toPublic(),
      data: 'OK'
    }
  }
})
