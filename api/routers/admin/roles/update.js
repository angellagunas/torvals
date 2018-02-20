const Route = require('lib/router/route')
const lov = require('lov')
const slugify = require('underscore.string/slugify')

const {Role} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/:uuid',
  validator: lov.object().keys({
    name: lov.string().required()
  }),
  handler: async function (ctx) {
    var roleId = ctx.params.uuid
    var data = ctx.request.body

    const role = await Role.findOne({'uuid': roleId, 'isDeleted': false})
    ctx.assert(role, 404, 'Role not found')

    var auxRole = await Role.findOne({priority: parseInt(data.priority)})
    if (auxRole) {
      ctx.throw(400, "You can't have two roles with the same priority")
    }

    data.slug = slugify(data.name)
    role.set(data)

    if (!data.description) role.set({description: ''})

    await role.save()

    ctx.body = {
      data: role.format()
    }
  }
})
