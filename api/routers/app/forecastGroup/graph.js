const moment = require('moment')
const Route = require('lib/router/route')
const _ = require('lodash')

const {
  ForecastGroup
} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/graph/:uuid',
  handler: async function (ctx) {
    const uuid = ctx.params.uuid

    const forecastGroup = await ForecastGroup.find({uuid: uuid, isDeleted: false}).populate('forecasts')

    let datasetsIds = forecastGroup.forecasts.map(item => {

    })

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
