const moment = require('moment')
const Route = require('lib/router/route')

const {
  Cycle,
  DataSetRow,
  Project,
  Rule,
  Channel,
  SalesCenter,
  Role
} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/adjustment/historical/:uuid',
  handler: async function (ctx) {
    const data = ctx.request.body
    const uuid = ctx.params.uuid
    const user = ctx.state.user
    let currentOrganization
    let currentRole

    let cycles

    if (!data.date_start || !data.date_end) {
      ctx.throw(400, '¡Es necesario filtrarlo por un rango de fechas!')
    }

    const project = await Project.findOne({uuid: uuid})
    if (ctx.state.organization) {
      currentOrganization = user.organizations.find(orgRel => {
        return ctx.state.organization._id.equals(orgRel.organization._id)
      })

      if (currentOrganization) {
        const role = await Role.findOne({_id: currentOrganization.role})

        currentRole = role.toPublic()
      }
    }
    let currentRule = await Rule.findOne({
      organization: ctx.state.organization._id,
      isCurrent: true,
      isDeleted: false
    })

    let initialMatch = {
      project: project._id
    }

    data.channels = data.channels.sort()
    data.salesCenters = data.salesCenters.sort()

    let start = moment(data.date_start, 'YYYY-MM-DD').utc()
    let end = moment(data.date_end, 'YYYY-MM-DD').utc()

    cycles = await Cycle.getBetweenDates(
      ctx.state.organization._id,
      currentRule._id,
      start.toDate(),
      end.toDate()
    )

    initialMatch['cycle'] = {
      $in: cycles.map(item => { return item._id })
    }

    if (data.channels) {
      const channels = await Channel.filterByUserRole(
        { uuid: { $in: data.channels } },
        currentRole.slug,
        user
      )
      initialMatch['channel'] = { $in: channels }
    }

    if (data.salesCenters) {
      const salesCenters = await SalesCenter.filterByUserRole(
        { uuid: { $in: data.salesCenters } },
        currentRole.slug,
        user
      )
      initialMatch['salesCenter'] = { $in: salesCenters }
    }

    let match = [{
      '$match': {
        ...initialMatch
      }
    }, {
      '$lookup': {
        'from': 'datasets',
        'localField': 'dataset',
        'foreignField': '_id',
        'as': 'datasetInfo'
      }
    },
    {
      '$match': {
        'datasetInfo.isDeleted': false,
        'datasetInfo.source': 'adjustment'
      }
    },
    {
      '$group': {
        '_id': {
          'dataset': '$datasetInfo.uuid',
          'date': '$data.forecastDate'
        },
        'prediction': {
          '$sum': '$data.prediction'
        },
        'adjustment': {
          '$sum': '$data.adjustment'
        },
        'sale': {
          '$sum': '$data.sale'
        }
      }
    },
    {
      '$unwind': {
        'path': '$_id.dataset'
      }
    },
    {
      '$project': {
        'dataset': '$_id.dataset',
        'date': '$_id.date',
        'prediction': '$prediction',
        'adjustment': '$adjustment',
        'sale': '$sale'
      }
    },
    {
      $sort: {dataset: 1, date: 1}
    }
    ]

    let responseData = await DataSetRow.aggregate(match)
    let totalPrediction = 0
    let totalSale = 0
    for (let response of responseData) {
      if (response.prediction && response.sale) {
        totalPrediction += response.prediction
        totalSale += response.sale
      }
    }
    let mape = 0
    if (totalSale !== 0) {
      mape = Math.abs((totalSale - totalPrediction) / totalSale) * 100
    }

    ctx.body = {
      data: responseData,
      mape: mape
    }
  }
})
