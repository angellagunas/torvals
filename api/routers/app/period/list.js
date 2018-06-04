const Route = require('lib/router/route')
const moment = require('moment')

const {Organization, Period} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/:uuid',
  handler: async function (ctx) {
    var organizationId = ctx.params.uuid

    if (organizationId !== ctx.state.organization.uuid) {
      ctx.throw(404, 'Organización no encontrada')
    }

    const org = await Organization.findOne({'uuid': organizationId, 'isDeleted': false})
    ctx.assert(org, 404, 'Organización no encontrada')

    var periods = await Period.find({organization: org._id, isDeleted: false}).populate('cycle')
    var years = new Set()

    periods.data = periods.map(item => {
      years.add(moment(item.cycle.dateStart).utc().format('YYYY'))
      years.add(moment(item.cycle.dateEnd).utc().format('YYYY'))
      return item.toPublic()
    })

    ctx.body = {
      data: periods.data,
      years: Array.from(years)
    }
  }
})
