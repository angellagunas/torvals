const Route = require('lib/router/route')
const lov = require('lov')

const {Organization, Note} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/:uuid/activate',
  validator: lov.object().keys({
    billingStart: lov.string().required(),
    billingEnd: lov.string().required(),
    name: lov.string().required(),
    email: lov.string().required(),
    phone: lov.string().required(),
    observation: lov.string()
  }),
  handler: async function (ctx) {
    var organizationId = ctx.params.uuid
    var data = ctx.request.body
    var user = ctx.state.user

    const org = await Organization.findOne({'uuid': organizationId, 'isDeleted': false})
    ctx.assert(org, 404, 'Organización no encontrada')

    org.set({
      status: 'active',
      billingStart: data.billingStart,
      billingEnd: data.billingEnd,
      salesRep: {
        name: data.name,
        email: data.email,
        phone: data.phone
      }
    })

    await org.save()

    if (data.observation) {
      await Note.create({
        user: user,
        organization: org,
        text: data.observation,
        source: 'observation'
      })
    }

    ctx.body = {
      data: org.toAdmin()
    }
  }
})
