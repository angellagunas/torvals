const Route = require('lib/router/route')
const lov = require('lov')
const slugify = require('underscore.string/slugify')

const {Organization} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/:uuid/step',
  validator: lov.object().keys({
    step: lov.object().keys({
      name: lov.string().required(),
      value: lov.boolean().required()
    })
  }),
  handler: async function (ctx) {
    var organizationId = ctx.params.uuid
    var data = ctx.request.body

    const org = await Organization.findOne({'uuid': organizationId, 'isDeleted': false})
    ctx.assert(org, 404, 'Organización no encontrada')

    var wizardSteps = org.wizardSteps
    wizardSteps[data.step.name] = data.step.value

    org.set({
      wizardSteps
    })

    await org.save()

    ctx.body = {
      data: org.toAdmin()
    }
  }
})
