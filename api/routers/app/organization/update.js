const Route = require('lib/router/route')
const lov = require('lov')
const slugify = require('underscore.string/slugify')

const {Organization} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/:uuid',
  validator: lov.object().keys({
    name: lov.string().required(),
    slug: lov.string().required()
  }),
  handler: async function (ctx) {
    var organizationId = ctx.params.uuid
    var data = ctx.request.body

    if (organizationId !== ctx.state.organization.uuid) {
      ctx.throw(404, 'Organización no encontrada')
    }

    var file = data.profile

    const org = await Organization.findOne({'uuid': organizationId, 'isDeleted': false})
    ctx.assert(org, 404, 'Organización no encontrada')

    data.slug = slugify(data.slug)
    org.set(data)

    if (!data.description) org.set({description: ''})

    org.save()

    if (file) {
      await org.uploadOrganizationPicture(file)
    }

    ctx.body = {
      data: org.format()
    }
  }
})
