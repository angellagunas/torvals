const Route = require('lib/router/route')
const lov = require('lov')
const slugify = require('underscore.string/slugify')

const {Group} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/',
  validator: lov.object().keys({
    name: lov.string().required()
  }),
  handler: async function (ctx) {
    var data = ctx.request.body

    if (!ctx.state.organization) {
      ctx.throw(404, 'Organización no encontrada')
    }

    data.slug = slugify(data.name)
    data.organization = ctx.state.organization
    const group = await Group.create(data)

    ctx.body = {
      data: group.toPublic()
    }
  }
})
