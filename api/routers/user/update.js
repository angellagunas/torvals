const Route = require('lib/router/route')
const lov = require('lov')

const { Language } = require('models')

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

    const language = await Language.findOne({uuid: data.language})
    if (!language) {
      return ctx.throw(400)
    }

    user.set({
      email: data.email,
      name: data.name,
      job: data.job,
      phone: data.phone,
      language
    })
    await user.save()

    ctx.body = {
      user: user.toPublic(),
      data: 'OK'
    }
  }
})
