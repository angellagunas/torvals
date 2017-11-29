const Route = require('lib/router/route')
const lov = require('lov')

const {SalesCenter, Organization} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/:uuid',
  validator: lov.object().keys({
    name: lov.string().required(),
    organization: lov.string().required()
  }),
  handler: async function (ctx) {
    var salesCenterId = ctx.params.uuid
    var data = ctx.request.body

    const salesCenter = await SalesCenter.findOne({
      'uuid': salesCenterId,
      'isDeleted': false
    }).populate('organization')
    .populate('groups')
    ctx.assert(salesCenter, 404, 'SalesCenter not found')

    const org = await Organization.findOne({uuid: data.organization})
    ctx.assert(org, 404, 'Organization not found')

    data.organization = org

    const salesCenterGroups = salesCenter.groups
    var newSalesCenterGroups = []

    for (var i = 0; i < salesCenterGroups.length; i++) {
      if (salesCenterGroups[i].organization.toString() === data.organization._id.toString()) {
        newSalesCenterGroups.push(salesCenterGroups[i])
      }
    }

    salesCenter.groups = newSalesCenterGroups

    salesCenter.set({
      name: data.name,
      description: data.description,
      organization: data.organization,
      address: data.address,
      externalId: data.externalId
    })

    salesCenter.save()

    ctx.body = {
      data: salesCenter
    }
  }
})
