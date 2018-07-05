const Route = require('lib/router/route')
const moment = require('moment')
const {
  CatalogItem,
  Cycle,
  DataSetRow,
  Project,
  Role,
  Rule
} = require('models')
const redis = require('lib/redis')
const crypto = require('crypto')
const _ = require('lodash')

const EXPIRATION = 60 * 60 * 24 * 4

module.exports = new Route({
  method: 'post',
  path: '/local/table',
  handler: async function (ctx) {
    const data = ctx.request.body
    const user = ctx.state.user
    let currentRole
    let currentOrganization

    if (!data.date_start || !data.date_end) {
      ctx.throw(400, '¡Es necesario filtrarlo por un rango de fechas!')
    }

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

    let filters = {
      organization: ctx.state.organization,
      mainDataset: { $ne: undefined }
    }

    if (data.projects && data.projects.length > 0) {
      filters['uuid'] = { $in: data.projects }
    }

    const projects = await Project.find(filters)
    const datasets = projects.map(item => { return item.mainDataset })

    if (projects.length === 1) {
      currentRule = await Rule.findOne({
        _id: projects[0].rule
      })
    }

    data.projects = data.projects.sort()
    data.catalogItems = data.catalogItems.sort()

    const parameterHash = 'api:' + crypto.createHash('md5').update(JSON.stringify(data) + JSON.stringify(datasets) + 'table').digest('hex')
    try {
      const cacheData = await redis.hGetAll(parameterHash)
      if (cacheData) {
        var cacheResponse = []
        for (let cacheItem in cacheData) {
          cacheResponse.push(JSON.parse(cacheData[cacheItem]))
        }

        ctx.body = {
          data: cacheResponse
        }
        return
      }
    } catch (e) {
      console.log('Error retrieving the cache')
    }

    const key = { product: '$newProduct' }
    let initialMatch = {
      dataset: { $in: datasets }
    }

    if (data.catalogItems && data.catalogItems.length > 0) {
      let catalogItems = await CatalogItem.filterByUserRole(
        { uuid: { $in: data.catalogItems } },
        currentRole.slug,
        user
      )

      catalogItems = await CatalogItem.find({_id: {$in: catalogItems}})
      let catalogItemsObj = {}

      for (let cat of catalogItems) {
        if (!catalogItemsObj[cat.type]) catalogItemsObj[cat.type] = [cat._id]
        else catalogItemsObj[cat.type].push(cat._id)
      }

      let catalogItemsMatch = []
      for (let key of Object.keys(catalogItemsObj)) {
        if (catalogItemsObj[key].length > 0) {
          catalogItemsMatch.push({
            'catalogItems': { $in: catalogItemsObj[key] }
          })
        }
      }

      initialMatch['$and'] = catalogItemsMatch
    }

    if (data.catalogItems && data.catalogItems.length === 0) {
      initialMatch['catalogItems'] = {$in: []}
    }

    let matchPreviousSale = _.cloneDeep(initialMatch)

    let start = moment(data.date_start, 'YYYY-MM-DD').utc()
    let end = moment(data.date_end, 'YYYY-MM-DD').utc()

    let cycles = await Cycle.getBetweenDates(
      currentOrganization.organization._id,
      currentRule._id,
      start.toDate(),
      end.toDate()
    )
    initialMatch['cycle'] = {
      $in: cycles.map(item => { return item._id })
    }

    start = moment(data.date_start, 'YYYY-MM-DD').subtract(1, 'years').utc()
    end = moment(data.date_end, 'YYYY-MM-DD').subtract(1, 'years').utc()

    cycles = await Cycle.getBetweenDates(
      currentOrganization.organization._id,
      currentRule._id,
      start.toDate(),
      end.toDate()
    )
    matchPreviousSale['cycle'] = {
      $in: cycles.map(item => { return item._id })
    }

    let conditions = []
    let group
    let previousGroup

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
              '$sum': {
                '$multiply': [
                  '$data.prediction',
                  '$price.price'
                ]
              }
            },
            'predictionSale': {
              '$sum': {
                '$cond': {
                  'if': {
                    '$gt': [
                      '$data.sale',
                      0.0
                    ]
                  },
                  'then': {
                    '$multiply': [
                      '$data.prediction',
                      '$price.price'
                    ]
                  },
                  'else': 0.0
                }
              }
            },
            'adjustment': {
              '$sum': {
                '$multiply': [
                  '$data.adjustment',
                  '$price.price'
                ]
              }
            },
            'sale': {
              '$sum': {
                '$multiply': [
                  '$data.sale',
                  '$price.price'
                ]
              }
            }
          }
        }
      ]

      previousGroup = [
        {
          '$group': {
            _id: key,
            sale: { $sum: {'$multiply': ['$data.sale', '$price.price']} }
          }
        }
      ]
    } else {
      group = [
        {
          '$group': {
            _id: key,
            prediction: { $sum: '$data.prediction' },
            predictionSale: {
              $sum: {
                $cond: {
                  if: {
                    $gt: ['$data.sale', 0]
                  },
                  then: '$data.prediction',
                  else: 0
                }
              }
            },
            adjustment: { $sum: '$data.adjustment' },
            sale: { $sum: '$data.sale' }
          }
        }
      ]

      previousGroup = [
        {
          '$group': {
            _id: key,
            sale: { $sum: '$data.sale' }
          }
        }
      ]
    }

    let match = [
      {
        '$match': {
          ...initialMatch
        }
      },
      ...conditions,
      ...group
    ]

    matchPreviousSale = [
      {
        '$match': {
          ...matchPreviousSale
        }
      },
      ...conditions,
      ...previousGroup
    ]

    let allData = await DataSetRow.aggregate(match)
    let previousSale = await DataSetRow.aggregate(matchPreviousSale)
    let products = allData.map(item => { return item._id.product })
    let previousProducts = previousSale.map(item => { return item._id.product })
    products = _.concat(products, previousProducts)
    products = await CatalogItem.find({_id: {$in: products}})
    let dataDict = {}

    for (let prod of products) {
      if (!dataDict[prod._id]) {
        dataDict[prod._id] = {
          product: prod.toPublic(),
          previousSale: 0,
          sale: {
            prediction: 0,
            adjustment: 0,
            sale: 0
          }
        }
      } else {
        dataDict[prod._id]['product'] = prod.toPublic()
      }
    }

    for (let prev of previousSale) {
      if (dataDict[prev._id.product]) {
        dataDict[prev._id.product]['previousSale'] = prev.sale
      }
    }

    previousSale = previousSale.filter(item => {
      if (!_.find(allData, {_id: { product: item._id.product }})) {
        return true
      } else {
        return false
      }
    }).map(item => {
      return { _id: { product: item._id.product },
        prediction: 0,
        predictionSale: 0,
        adjustment: 0,
        sale: 0 }
    })

    allData = _.concat(allData, previousSale)

    let responseData = allData.map(item => {
      let product = item._id.product
      if (product === null) return

      let data = dataDict[product]
      let mape = 0
      let prediction = item.predictionSale
      let sale = item.sale

      if (sale > 0) {
        mape = Math.abs((sale - prediction) / sale) * 100
      }

      return {
        product: data.product,
        prediction: item.prediction,
        adjustment: item.adjustment,
        sale: item.sale,
        previousSale: data.previousSale,
        mape: mape
      }
    })
    responseData = responseData.filter(item => { return item })

    try {
      for (let item in responseData) {
        await redis.hSet(parameterHash, item, JSON.stringify(responseData[item]))
        await redis.expire(parameterHash, EXPIRATION)
      }
    } catch (e) {
      console.log('Error setting the cache')
    }

    ctx.body = {
      data: responseData
    }
  }
})
