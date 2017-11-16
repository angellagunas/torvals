const Route = require('lib/router/route')
const {Group, SalesCenter} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/:uuid/add/group',
  handler: async function (ctx) {
    const salesCenterId = ctx.params.uuid

    const salesCenter = await SalesCenter.findOne({'uuid': salesCenterId})
    ctx.assert(salesCenter, 404, 'Sales Center not found')

    const group = await Group.findOne({'uuid': ctx.request.body.group})
    ctx.assert(group, 404, 'Group not found')

    salesCenter.groups.push(group)
    salesCenter.save()

    ctx.body = {
      data: salesCenter
    }
  }
})
