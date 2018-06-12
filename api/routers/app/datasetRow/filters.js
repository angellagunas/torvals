const Route = require('lib/router/route')
const moment = require('moment')

const {
  DataSetRow,
  DataSet,
  Channel,
  SalesCenter,
  Product,
  AbraxasDate,
  Role,
  Cycle,
  Period
} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/filters/dataset/:uuid',
  handler: async function (ctx) {
    var datasetId = ctx.params.uuid
    var filters = {}

    const dataset = await DataSet.findOne({
      'uuid': datasetId,
      'isDeleted': false,
      organization: ctx.state.organization
    })

    ctx.assert(dataset, 404, 'DataSet no encontrado')

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
      currentRole.slug === 'manager-level-2' ||
      currentRole.slug === 'consultor'
    ) {
      var groups = user.groups

      filters['groups'] = {$all: groups}
      filters['organization'] = currentOrganization.organization._id
    }

    var products = await DataSetRow.find({isDeleted: false, dataset: dataset}).distinct('product')
    var channels = await DataSetRow.find({isDeleted: false, dataset: dataset}).distinct('channel')
    var salesCenters = await DataSetRow.find({isDeleted: false, dataset: dataset}).distinct('salesCenter')
    var cycles = await DataSetRow.find({isDeleted: false, dataset: dataset}).distinct('cycle')

    cycles = await Cycle.find({
      organization: ctx.state.organization,
      rule: dataset.rule,
      dateStart: {$lte: moment.utc(dataset.dateMax), $gte: moment.utc(dataset.dateMin).subtract(1, 'days')}
    }).sort('-dateStart')

    cycles = cycles.map(item => {
      return {
        cycle: item.cycle,
        uuid: item.uuid,
        dateStart: item.dateStart,
        dateEnd: item.dateEnd
      }
    })

    channels = await Channel.find({ _id: { $in: channels }, ...filters })
    salesCenters = await SalesCenter.find({ _id: { $in: salesCenters }, ...filters })
    products = await Product.find({ _id: { $in: products } })

    let statement = [
      {
        '$match': {
          'uuid': dataset.uuid
        }
      },
      {
        '$unwind': {
          'path': '$catalogItems'
        }
      },
      {
        '$lookup': {
          'from': 'catalogitems',
          'localField': 'catalogItems',
          'foreignField': '_id',
          'as': 'catalogItem'
        }
      },
      {
        '$unwind': {
          'path': '$catalogItem'
        }
      },
      {
        '$group': {
          '_id': '$catalogItem.type',
          'items': {
            '$push': '$catalogItem'
          }
        }
      }
    ]

    let catalogs = await DataSet.aggregate(statement)
    let catalogsResponse = []

    for (let catalog of catalogs) {
      catalogsResponse[catalog._id] = []
      for (let item of catalog.items) {
        catalogsResponse[catalog._id].push(item)
      }
    }

    ctx.body = {
      cycles,
      channels,
      salesCenters,
      products,
      ...catalogsResponse
    }
  }
})
