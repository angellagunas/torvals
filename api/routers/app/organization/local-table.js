const Route = require('lib/router/route')
const moment = require('moment')
const { Project, DataSetRow, Product, Channel, SalesCenter, AbraxasDate, Role } = require('models')
const redis = require('lib/redis')
const crypto = require('crypto')
const _ = require('lodash')

module.exports = new Route({
  method: 'post',
  path: '/local/table',
  handler: async function (ctx) {
    const data = ctx.request.body
    const user = ctx.state.user
    let currentRole
    let currentOrganization

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
      mainDataset: {$ne: undefined}
    }

    if (data.projects && data.projects.length > 0) {
      filters['uuid'] = {$in: data.projects}
    }

    const projects = await Project.find(filters)
    const datasets = projects.map(item => { return item.mainDataset })

    data.channels = data.channels.sort()
    data.projects = data.projects.sort()
    data.salesCenters = data.salesCenters.sort()

    const parameterHash = crypto.createHash('md5').update(JSON.stringify(data) + JSON.stringify(datasets) + 'table').digest('hex')
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
      let channels = await Channel.find({ uuid: { $in: data.channels } }).select({'_id': 1, 'groups': 1})
      if (currentRole.slug === 'manager-level-2') {
        channels = channels.filter(item => {
          let checkExistence = item.groups.some(function (e) {
            return user.groups.indexOf(String(e)) >= 0
          })
          return checkExistence
        }).map(item => { return item._id })
      } else {
        channels = channels.map(item => { return item._id })
      }
      initialMatch['channel'] = { $in: channels }
    }

    if (data.salesCenters) {
      let salesCenters = await SalesCenter.find({ uuid: { $in: data.salesCenters } }).select({'_id': 1, 'groups': 1})
      if (currentRole.slug === 'manager-level-2') {
        salesCenters = salesCenters.filter(item => {
          let checkExistence = item.groups.some(function (e) {
            return user.groups.indexOf(String(e)) >= 0
          })
          return checkExistence
        }).map(item => { return item._id })
      } else {
        salesCenters = salesCenters.map(item => { return item._id })
      }
      initialMatch['salesCenter'] = { $in: salesCenters }
    }

    if (data.products) {
      const products = await Product.find({ uuid: { $in: data.products } }).select({'_id': 1})
      initialMatch['product'] = { $in: products.map(item => { return item._id }) }
    }

    let matchPreviousSale = _.cloneDeep(initialMatch)

    if (data.date_start && data.date_end) {
      const weeks = await AbraxasDate.find({ $and: [{dateStart: {$gte: data.date_start}}, {dateEnd: {$lte: data.date_end}}] })
      data.weeks = []
      for (let week of weeks) {
        data.weeks.push(week.week)
      }

      data.year = moment(data.date_start).year()

      initialMatch['data.semanaBimbo'] = {$in: data.weeks}

      var lastYear = data.year - 1
      matchPreviousSale['data.semanaBimbo'] = {$in: data.weeks}
    } else {
      ctx.throw(400, '¡Es necesario filtrarlo por un rango de fechas!')
    }

    let match = [
      {
        '$match': {
          ...initialMatch
        }
      },
      {
        '$redact': {
          '$cond': [
                { '$eq': [{ '$year': '$data.forecastDate' }, data.year] },
            '$$KEEP',
            '$$PRUNE'
          ]
        }
      },
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

    matchPreviousSale = [
      {
        '$match': {
          ...matchPreviousSale
        }
      },
      {
        '$redact': {
          '$cond': [
                { '$eq': [{ '$year': '$data.forecastDate' }, lastYear] },
            '$$KEEP',
            '$$PRUNE'
          ]
        }
      },
      {
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
      }
    } catch (e) {
      console.log('Error setting the cache')
    }

    ctx.body = {
      data: responseData
    }
  }
})
