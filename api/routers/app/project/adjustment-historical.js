const moment = require('moment')
const Route = require('lib/router/route')

const {
  Cycle,
  DataSetRow,
  Project,
  Rule
} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/adjustment/historical/:uuid',
  handler: async function (ctx) {
    const data = ctx.request.body
    const uuid = ctx.params.uuid

    let cycles

    if (!data.date_start || !data.date_end) {
      ctx.throw(400, '¡Es necesario filtrarlo por un rango de fechas!')
    }

    const project = await Project.findOne({uuid: uuid})

    let currentRule = await Rule.findOne({
      organization: ctx.state.organization._id,
      isCurrent: true,
      isDeleted: false
    })

    let initialMatch = {
      project: project._id
    }

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
    }
    ]

    let responseData = await DataSetRow.aggregate(match)

    ctx.body = {
      data: responseData
    }
  }
})
