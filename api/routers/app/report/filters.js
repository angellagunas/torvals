const Route = require('lib/router/route')
const {
  DataSet,
  DataSetRow,
  Project,
  User,
  Organization,
  CatalogItem,
  Cycle,
  Rule,
  Period
} = require('models')
const moment = require('moment')

module.exports = new Route({
  method: 'get',
  path: '/filters/:uuid',
  handler: async function (ctx) {
    const organization = await Organization.findOne({_id: ctx.state.organization._id})
    const datasetId = ctx.params.uuid

    const dataset = await DataSet.findOne({
      uuid: datasetId,
      isDeleted: false,
      organization: ctx.state.organization
    }).populate('rule')

    ctx.assert(dataset, 404, 'DataSet no encontrado')

    const rule = await Rule.findOne({
      organization: organization._id
    })

    let cycles = await DataSetRow.find({isDeleted: false, dataset: dataset}).distinct('cycle')

    cycles = await Cycle.find({
      organization: ctx.state.organization,
      rule: dataset.rule,
      dateStart: {$lte: moment.utc(dataset.dateMax), $gte: moment.utc(dataset.dateMin).subtract(1, 'days')}
    }).sort('-dateStart').limit(rule.cyclesAvailable)

    cycles.data = cycles.map(async item => {
      if (String(dataset.project) === '5b5ba0ac83afa00038095701' || String(dataset.project) === '5b3e3cbf7fecc8004a81cd26') {
        return {
        uuid: item.uuid,
        dateStart: item.dateStart,
        dateEnd: item.dateEnd
        }
      }

      const periods = await Period.find({
        cycle: item._id
      })

      return {
        cycle: item.cycle,
        uuid: item.uuid,
        dateStart: item.dateStart,
        dateEnd: item.dateEnd,
        periodStart: (periods[0] || {}).period,
        periodEnd: (periods[periods.length - 1] || {}).period
      }
    })

    cycles.data = await Promise.all(cycles.data)

    let invalidCatalogs = ['5b71e9abc2eb13002b7a700b', '5b71ea41e8ca55002673973c', '5b71ea8be8ca55002673973d']
    let groupIds = ctx.state.user.groups.filter((item) => {return !invalidCatalogs.includes(String(item)) })
    const groups = groupIds.map((group) => {return String(group)})

    const users = await User.find({
      isDeleted: false,
      isOperationalUser: true,
      'organizations.organization': organization._id,
      groups: {$in: groups}
    }).populate('groups')
      .populate('organizations.role')

    const catalogItems = await CatalogItem.find({
      isDeleted: false,
      organization: organization._id,
      type: {$nin: ['producto', 'productos']}
    }).populate('organization')

    catalogItems.data = catalogItems.map((item) => {
      return item.toPublic()
    })

    ctx.body = {
      cycles: cycles.data,
      users: users,
      catalogItems: catalogItems.data
    }
  }
})
