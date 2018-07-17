const Route = require('lib/router/route')
const _ = require('lodash')

const {
  ForecastGroup,
  DataSetRow,
  Forecast,
  Engine,
  CatalogItem,
  Rule
} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/graph/compare/table/:uuid',
  handler: async function (ctx) {
    const uuid = ctx.params.uuid
    const data = ctx.request.body

    if (!data.engines) {
      ctx.throw(422, 'Se necesitan especificar los modelos a comparar')
    }

    const forecastGroup = await ForecastGroup.findOne({uuid: uuid, isDeleted: false}).populate('forecasts engines project')
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
    const key = {product: '$newProduct', engine: '$forecast.engine', 'catalogItems': '$catalogItems'}

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
            '_id': key,
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
            '_id': key,
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
      {
        '$lookup': {
          'from': 'forecasts',
          'localField': 'dataset',
          'foreignField': 'dataset',
          'as': 'forecast'
        }
      },
      ...group,
      {
        '$lookup': {
          'from': 'catalogitems',
          'localField': '_id.product',
          'foreignField': '_id',
          'as': 'product'
        }
      },
      {
        '$lookup': {
          'from': 'engines',
          'localField': '_id.engine',
          'foreignField': '_id',
          'as': 'engine'
        }
      },
      {
        '$addFields': {
          'catalogItems': {
            '$reduce': {
              'input': '$_id.catalogItems',
              'initialValue': [

              ],
              'in': {
                '$setUnion': [
                  '$$value',
                  '$_id.catalogItems'
                ]
              }
            }
          }
        }
      },
      {
        '$lookup': {
          'from': 'catalogitems',
          'localField': 'catalogItems',
          'foreignField': '_id',
          'as': 'catalogs'
        }
      }
    ]

    let responseData = await DataSetRow.aggregate(match)

    let response = []

    for (let row of responseData) {
      let element = _.find(response,
        {
          product: {_id: row.product[0]._id},
          catalogs: row.catalogs.map(item => ({_id: item._id}))
        })

      if (!element) {
        element = response.push({
          product: row.product[0],
          engines: [{...row.engine[0], prediction: row.prediction}],
          catalogs: row.catalogs
        })
      } else {
        element['engines'].push({
          ...row.engine[0],
          prediction: row.prediction
        })
      }
    }

    ctx.body = response
  }
})
