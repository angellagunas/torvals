const Route = require('lib/router/route')
const {Group, SalesCenter} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/:uuid/remove/group',
  handler: async function (ctx) {
    const userId = ctx.params.uuid

    const salesCenter = await SalesCenter.findOne({'uuid': userId})
    ctx.assert(salesCenter, 404, 'Sales Center not found')

    const group = await Group.findOne({'uuid': ctx.request.body.group})
    ctx.assert(group, 404, 'Group not found')

    var pos = salesCenter.groups.indexOf(group._id)
    salesCenter.groups.splice(pos, 1)
    salesCenter.save()

    ctx.body = {
      data: salesCenter
    }
  }
})
