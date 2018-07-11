const Route = require('lib/router/route')
const _ = require('lodash')

const {
  ForecastGroup,
  DataSetRow,
  Forecast,
  Engine,
  CatalogItem
} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/graph/compare/:uuid',
  handler: async function (ctx) {
    const uuid = ctx.params.uuid
    const data = ctx.request.body

    if (!data.engines) {
      ctx.throw(422, 'Se necesitan especificar los modelos a comparar')
    }

    const forecastGroup = await ForecastGroup.findOne({uuid: uuid, isDeleted: false}).populate('forecasts engines')
    ctx.assert(forecastGroup, 404, 'ForecastGroup no encontrado')

    const engines = await Engine.find({uuid: {$in: data.engines}})
    data.engines = engines.map(item => {
      return item._id
    })

    const forecasts = await Forecast.find({forecastGroup: forecastGroup._id, engine: {$in: data.engines}})

    let datasets = forecasts.map(item => {
      return item.dataset
    })

    let initialMatch = {
      dataset: {$in: datasets}
    }

    if (data.catalogItems) {
      let catalogItems = await CatalogItem.find({
        uuid: { $in: data.catalogItems }
      }).select({ '_id': 1 })
      initialMatch['catalogItems'] = {
        $in: catalogItems.map(item => { return item._id })
      }
    }

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
            }
          }
        }
      ]
    }

    let match = [
      {
        '$match': {...initialMatch}
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
    let totalPrediction = {}
    responseData.data = responseData.map(item => {
      let forecast = _.find(forecastGroup.forecasts, {dataset: item.dataset})
      let engine = _.find(forecastGroup.engines, {_id: forecast.engine})
      if (!totalPrediction[engine.uuid]) { totalPrediction[engine.uuid] = {prediction: 0, name: engine.name} }
      totalPrediction[engine.uuid].prediction += item.prediction

      return {
        ...item,
        engine: engine.uuid
      }
    })

    ctx.body = {
      data: responseData.data,
      total: {...totalPrediction}
    }
  }
})
