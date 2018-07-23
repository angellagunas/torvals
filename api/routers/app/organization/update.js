const Route = require('lib/router/route')
const lov = require('lov')
const slugify = require('underscore.string/slugify')

const {Organization} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/:uuid',
  validator: lov.object().keys({
    name: lov.string().required(),
    description: lov.string(),
    country: lov.string(),
    status: lov.string(),
    employees: lov.number(),
    rfc: lov.string(),
    billingEmail: lov.string(),
    businessName: lov.string(),
    businessType: lov.string(),
    accountType: lov.string(),
    availableUsers: lov.number(),
    salesRep: lov.object().keys({
      name: lov.string(),
      email: lov.string().email(),
      phone: lov.string()
    })
  }),
  handler: async function (ctx) {
    console.log('ctx.params', ctx.params)
    var organizationId = ctx.params.uuid
    var data = ctx.request.body

    /* if (organizationId !== ctx.state.organization.uuid) {
      ctx.throw(404, 'Organización no encontrada')
    } */

    var file = data.profile || ''

    const org = await Organization.findOne({'uuid': organizationId, 'isDeleted': false})
    ctx.assert(org, 404, 'Organización no encontrada')

    org.set({
      name: data.name,
      slug: data.slug,
      country: data.country,
      status: data.status,
      employees: data.employees,
      rfc: data.rfc,
      billingEmail: data.billingEmail,
      businessName: data.businessName,
      businessType: data.businessType,
      accountType: data.accountType,
      availableUsers: data.availableUsers,
      salesRep: data.salesRep
    })

    if (!data.description) org.set({description: ''})

    org.save()

    if (file) {
      await org.uploadOrganizationPicture(file)
    }

    ctx.body = {
      data: org.toPublic()
    }
  }
})
