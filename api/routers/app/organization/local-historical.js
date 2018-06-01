const Route = require('lib/router/route')
const { Project, DataSetRow, Channel, SalesCenter, Product, Role, Cycle } = require('models')
const moment = require('moment')
const redis = require('lib/redis')
const crypto = require('crypto')
const _ = require('lodash')

const EXPIRATION = 60 * 60 * 24 * 4

module.exports = new Route({
  method: 'post',
  path: '/local/historical',
  handler: async function (ctx) {
    const data = ctx.request.body
    const user = ctx.state.user
    let currentRole
    let currentOrganization
    let previousWeeks
    let weeks

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

    const parameterHash = 'api:' + crypto.createHash('md5').update(JSON.stringify(data) + JSON.stringify(datasets) + 'historical').digest('hex')
    try {
      const cacheData = await redis.hGetAll(parameterHash)
      if (cacheData) {
        var cacheResponse = []
        var cacheMape
        for (let cacheItem in cacheData) {
          if (cacheItem !== 'mape') {
            cacheResponse.push(JSON.parse(cacheData[cacheItem]))
          } else {
            cacheMape = Number(cacheData[cacheItem])
          }
        }

        ctx.body = {
          data: cacheResponse,
          mape: cacheMape
        }
        return
      }
    } catch (e) {
      console.log('Error retrieving the cache')
    }

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

    let start = moment.utc(data.date_start, 'YYYY-MM-DD')
    let end = moment.utc(data.date_end, 'YYYY-MM-DD')

    weeks = await Cycle.find({
      $and: [{
        dateStart: { $gte: start }
      }, {
        dateEnd: { $lte: end }
      }]
    })
    initialMatch['data.forecastDate'] = {
      $lte: end.toDate(),
      $gte: start.toDate()
    }

    start = moment.utc(data.date_start, 'YYYY-MM-DD').subtract(1, 'years')
    end = moment.utc(data.date_end, 'YYYY-MM-DD').subtract(1, 'years')

    previousWeeks = await Cycle.find({
      $and: [{
        dateStart: { $gte: start.toDate() }
      },{
        dateEnd: { $lte: end.toDate() }
      }]
    })
    matchPreviousSale['data.forecastDate'] = {
      $lte: end.toDate(),
      $gte: start.toDate()
    }

    const key = {
      week: '$period',
      date: '$data.forecastDate'
    }
    let match = [{
        '$match': {
          ...initialMatch
        }
      }, {
        '$group': {
          _id: key,
          prediction: { $sum: '$data.prediction' },
          adjustment: { $sum: '$data.adjustment' },
          sale: { $sum: '$data.sale' }
        }
      }, {
        $sort: { '_id.date': 1 }
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
      }, {
        $sort: { '_id.date': 1 }
      }
    ]

    let responseData = await DataSetRow.aggregate(match)
    let previousSale = await DataSetRow.aggregate(matchPreviousSale)

    let previousSaleDict = {}
    for (let prev of previousSale) {
      previousSaleDict[prev._id.date] = prev
    }

    let saleDict = {}
    for (let res of responseData) {
      saleDict[res._id.date] = res
    }

    let totalPrediction = 0
    let totalSale = 0
    let response = []

    for (let date of weeks) {
      let dateStart = date.dateStart
      let item = {
        date: dateStart,
        prediction: 0,
        adjustment: 0,
        sale: 0,
        previousSale: 0
      }

      if (saleDict[dateStart]) {
        item.prediction = saleDict[dateStart].prediction
        item.adjustment = saleDict[dateStart].adjustment
        item.sale = saleDict[dateStart].sale
      }

      if (item.prediction && item.sale) {
        totalPrediction += item.prediction
        totalSale += item.sale
      }

      let lastDate = previousWeeks.find(cycle => {
        return moment(cycle.dateStart, 'YYYY-MM-DD') === moment(date.dateStart, 'YYYY-MM-DD').subtract(1, 'years')
      })

      if (lastDate && previousSaleDict[lastDate.dateStart]) {
        item.previousSale = previousSaleDict[lastDate.dateStart].sale
      }

      response.push(item)
    }

    let mape = 0

    if (totalSale !== 0) {
      mape = Math.abs((totalSale - totalPrediction) / totalSale) * 100
    }

    try {
      for (let item in response) {
        await redis.hSet(parameterHash, item, JSON.stringify(response[item]))
      }
      await redis.hSet(parameterHash, 'mape', mape)
      await redis.expire(parameterHash, EXPIRATION)
    } catch (e) {
      console.log('Error setting the cache')
    }

    ctx.body = {
      data: response,
      mape: mape
    }
  }
})
