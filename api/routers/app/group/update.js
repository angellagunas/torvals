const Route = require('lib/router/route')
const lov = require('lov')
const slugify = require('underscore.string/slugify')

const {Group} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/:uuid',
  validator: lov.object().keys({
    name: lov.string().required()
  }),
  handler: async function (ctx) {
    var groupId = ctx.params.uuid
    var data = ctx.request.body

    const group = await Group.findOne({'uuid': groupId, 'isDeleted': false})
    ctx.assert(group, 404, 'Grupo no encontrado')

    data.slug = slugify(data.name)
    group.set(data)

    if (!data.description) group.set({description: ''})

    group.save()

    ctx.body = {
      data: group.toPublic()
    }
  }
})
