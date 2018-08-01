const moment = require('moment')
const Route = require('lib/router/route')
const _ = require('lodash')

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
      isDeleted: false,
      $or: [{source: 'adjustment'}, {_id: project.mainDataset}]
    })

    data.datasets = datasets.map((item) => {
      return item._id
    })

    let conditions = []
    let group

    if (data.prices) {
      conditions = [
        {
          '$lookup': {
            'from': 'catalogitems',
            'localField': 'catalogItems',
            'foreignField': '_id',
            'as': 'catalogs'
          }
        },
        {
          '$lookup': {
            'from': 'prices',
            'localField': 'newProduct',
            'foreignField': 'product',
            'as': 'price'
          }
        },
        {
          '$unwind': {
            'path': '$price'
          }
        },
        {
          '$addFields': {
            'catalogsSize': {
              '$size': '$price.catalogItems'
            }
          }
        },
        {
          '$match': {
            'catalogsSize': {
              '$gte': 1.0
            }
          }
        },
        {
          '$redact': {
            '$cond': [
              {
                '$setIsSubset': [
                  '$price.catalogItems',
                  '$catalogItems'
                ]
              },
              '$$KEEP',
              '$$PRUNE'
            ]
          }
        }
      ]

      group = [
        {
          '$group': {
            '_id': {
              'dataset': '$dataset',
              'date': '$data.forecastDate'
            },
            'prediction': {
              '$sum': {$multiply: ['$data.prediction', '$price.price']}
            },
            'adjustment': {
              '$sum': {$multiply: ['$data.adjustment', '$price.price']}
            },
            'sale': {
              '$sum': {$multiply: ['$data.sale', '$price.price']}
            }
          }
        }
      ]
    } else {
      group = [
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
        }
      ]
    }

    let match = [
      {
        '$match': {
          ...initialMatch,
          dataset: {$in: data.datasets}
        }
      },
      ...conditions,
      ...group,
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
    let totalSaleAdjustment = 0
    let totalAdjustment = 0
    for (let response in responseData) {
      responseData[response] = {
        ...responseData[response],
        name: _.find(datasets, {_id: responseData[response].dataset}).name
      }
      if (responseData[response].prediction && responseData[response].sale) {
        totalPrediction += responseData[response].prediction
        totalSale += responseData[response].sale
      }

      if (responseData[response].adjustment && responseData[response].sale) {
        totalAdjustment += responseData[response].adjustment
        totalSaleAdjustment += responseData[response].sale
      }
    }

    let mapeAdjustment = 0
    let mapePrediction = 0

    if (totalSale !== 0) {
      mapePrediction = Math.abs((totalSale - totalPrediction) / totalSale) * 100
    }

    if (totalSaleAdjustment !== 0) {
      mapeAdjustment = Math.abs((totalSaleAdjustment - totalAdjustment) / totalSaleAdjustment) * 100
    }

    let diffPredictionAdjustment = mapePrediction - mapeAdjustment

    ctx.body = {
      data: responseData,
      mapePrediction: mapePrediction,
      mapeAdjustment: mapeAdjustment,
      difference: diffPredictionAdjustment
    }
  }
})