const Route = require('lib/router/route')
const moment = require('moment')
const { Project, DataSetRow, Product, Channel, SalesCenter, Role, Cycle } = require('models')
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

    let filters = {
      organization: ctx.state.organization,
      mainDataset: { $ne: undefined }
    }

    if (data.projects && data.projects.length > 0) {
      filters['uuid'] = { $in: data.projects }
    }

    const projects = await Project.find(filters)
    const datasets = projects.map(item => { return item.mainDataset })

    data.channels = data.channels.sort()
    data.projects = data.projects.sort()
    data.salesCenters = data.salesCenters.sort()

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

    const key = {product: '$product'}
    let initialMatch = {
      dataset: { $in: datasets }
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

    if (data.products) {
      const products = await Product.find({ uuid: { $in: data.products } }).select({'_id': 1})
      initialMatch['product'] = { $in: products.map(item => { return item._id }) }
    }

    let matchPreviousSale = _.cloneDeep(initialMatch)

    let start = moment(data.date_start, 'YYYY-MM-DD').utc()
    let end = moment(data.date_end, 'YYYY-MM-DD').utc()

    let cycles = await Cycle.getBetweenDates(
      currentOrganization.organization._id,
      start.toDate(),
      end.toDate()
    )
    initialMatch['cycle'] = {
      $in: cycles.map(item => { return item._id })
    }

    start = moment(data.date_start, 'YYYY-MM-DD').subtract(1, 'years').utc()
    end = moment(data.date_start, 'YYYY-MM-DD').subtract(1, 'd').utc()

    cycles = await Cycle.getBetweenDates(
      currentOrganization.organization._id,
      start.toDate(),
      end.toDate()
    )
    matchPreviousSale['cycle'] = {
      $in: cycles.map(item => { return item._id })
    }

    let match = [{
        '$match': {
          ...initialMatch
        }
      }, {
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

    matchPreviousSale = [{
        '$match': {
          ...matchPreviousSale
        }
      }, {
        '$group': {
          _id: key,
          sale: { $sum: '$data.sale' }
        }
      }
    ]

    let allData = await DataSetRow.aggregate(match)
    let previousSale = await DataSetRow.aggregate(matchPreviousSale)
    let products = allData.map(item => { return item._id.product })
    let previousProducts = previousSale.map(item => { return item._id.product })
    products = _.concat(products, previousProducts)
    products = await Product.find({_id: {$in: products}})
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
