const Route = require('lib/router/route')

const {Group} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/:uuid',
  handler: async function (ctx) {
    var groupId = ctx.params.uuid

    const group = await Group.findOne({'uuid': groupId, 'isDeleted': false})
      .populate('organization')
      .populate('channels')
      .populate('catalogItems')
    ctx.assert(group, 404, 'Grupo no encontrado')

    ctx.body = {
      data: group.toPublic()
    }
  }
})