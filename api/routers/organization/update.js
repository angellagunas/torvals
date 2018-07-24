const Route = require('lib/router/route')
const lov = require('lov')
const slugify = require('underscore.string/slugify')

const {Organization} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/update/:uuid',
  validator: lov.object().keys({
    name: lov.string().required(),
    country: lov.string(),
    status: lov.string(),
    employees: lov.number(),
    rfc: lov.string(),
    billingEmail: lov.string(),
    businessName: lov.string(),
    businessType: lov.string(),
    salesRep: lov.object().keys({
      name: lov.string(),
      email: lov.string().email(),
      phone: lov.string()
    })
  }),
  handler: async function (ctx) {
    var organizationId = ctx.params.uuid
    var data = ctx.request.body

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
      salesRep: data.salesRep
    })

    org.save()

    ctx.body = {
      data: org.toPublic()
    }
  }
})
