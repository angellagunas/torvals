const Route = require('lib/router/route')
const lov = require('lov')

const {Organization} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/:uuid/update-status',
  validator: lov.object().keys({
    status: lov.string().required()
  }),
  handler: async function (ctx) {
    var organizationId = ctx.params.uuid
    var data = ctx.request.body

    const org = await Organization.findOne({'uuid': organizationId, 'isDeleted': false})
    ctx.assert(org, 404, 'Organización no encontrada')

    org.set({
      status: data.status
    })

    await org.save()

    ctx.body = {
      data: org.toPublic()
    }
  }
})
