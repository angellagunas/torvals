const moment = require('moment')
const Route = require('lib/router/route')

const {
  Cycle,
  DataSetRow,
  Project,
  Channel,
  SalesCenter,
  Role,
  CatalogItem,
  DataSet
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

    const project = await Project.findOne({uuid: uuid}).populate('rule')
    if (ctx.state.organization) {
      currentOrganization = user.organizations.find(orgRel => {
        return ctx.state.organization._id.equals(orgRel.organization._id)
      })

      if (currentOrganization) {
        const role = await Role.findOne({_id: currentOrganization.role})

        currentRole = role.toPublic()
      }
    }

    let initialMatch = {
      project: project._id
    }

    let start = moment(data.date_start, 'YYYY-MM-DD').utc()
    let end = moment(data.date_end, 'YYYY-MM-DD').utc()

    cycles = await Cycle.getBetweenDates(
      ctx.state.organization._id,
      project.rule._id,
      start.toDate(),
      end.toDate()
    )

    initialMatch['cycle'] = {
      $in: cycles.map(item => { return item._id })
    }

    if (data.catalogItems) {
      let catalogItems = await CatalogItem.find({
        uuid: { $in: data.catalogItems }
      }).select({ '_id': 1 })
      initialMatch['catalogItems'] = {
        $in: catalogItems.map(item => { return item._id })
      }
    }

    const datasets = await DataSet.find({
      project: project._id,
      isDeleted: false
    })

    data.datasets = datasets.map((item) => {
      return item._id
    })

    let match = [{
      '$match': {
        ...initialMatch,
        dataset: {$in: data.datasets}
      }
    },
    {
      '$group': {
        '_id': {
          'dataset': '$dataset',
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
