const Route = require('lib/router/route')
const moment = require('moment')

const {
  DataSetRow,
  DataSet,
  Channel,
  SalesCenter,
  Product,
  AbraxasDate,
  Role
} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/filters/dataset/:uuid',
  handler: async function (ctx) {
    var datasetId = ctx.params.uuid

    const dataset = await DataSet.findOne({
      'uuid': datasetId,
      'isDeleted': false,
      organization: ctx.state.organization
    })

    ctx.assert(dataset, 404, 'DataSet no encontrado')

    var rows = await DataSetRow.find({isDeleted: false, dataset: dataset._id})

    var semanasBimbo = Array.from(new Set(rows.map(item => { return item.data.semanaBimbo })))
    var channels = Array.from(new Set(rows.map(item => { return String(item.channel) })))
    var salesCenters = Array.from(new Set(rows.map(item => { return String(item.salesCenter) })))
    var products = Array.from(new Set(rows.map(item => { return String(item.product) })))

    const user = ctx.state.user
    var currentRole
    const currentOrganization = user.organizations.find(orgRel => {
      return ctx.state.organization._id.equals(orgRel.organization._id)
    })

    if (currentOrganization) {
      const role = await Role.findOne({_id: currentOrganization.role})

      currentRole = role.toPublic()
    }

    if (
      currentRole.slug === 'manager-level-1' ||
      currentRole.slug === 'manager-level-2'
    ) {
      var groups = user.groups

      salesCenters = await SalesCenter.find({groups: {$in: groups}, organization: currentOrganization.organization._id})
      channels = await Channel.find({groups: {$in: groups}, organization: currentOrganization.organization._id})
    }

    semanasBimbo.sort((a, b) => {
      return a - b
    })

    var dates = await AbraxasDate.find({
      week: {$in: semanasBimbo},
      dateStart: {$lte: moment.utc(dataset.dateMax), $gte: moment.utc(dataset.dateMin).subtract(1, 'days')}
    }).sort('-dateStart')

    dates = dates.map(item => {
      return {
        week: item.week,
        month: item.month,
        year: item.year,
        dateStart: item.dateStart,
        dateEnd: item.dateEnd
      }
    })

    channels = await Channel.find({ _id: { $in: channels } })
    salesCenters = await SalesCenter.find({ _id: { $in: salesCenters } })
    products = await Product.find({ _id: { $in: products } })

    ctx.body = {
      semanasBimbo,
      channels,
      salesCenters,
      products,
      dates
    }
  }
})
