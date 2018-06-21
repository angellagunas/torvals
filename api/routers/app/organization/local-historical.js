const _ = require('lodash')
const crypto = require('crypto')
const moment = require('moment')
const redis = require('lib/redis')
const Route = require('lib/router/route')
const {
  CatalogItem,
  Channel,
  Cycle,
  DataSetRow,
  Period,
  Product,
  Project,
  Role,
  Rule,
  SalesCenter
} = require('models')

const EXPIRATION = 60 * 60 * 24 * 4

module.exports = new Route({
  method: 'post',
  path: '/local/historical',
  handler: async function (ctx) {
    const data = ctx.request.body
    const user = ctx.state.user
    let currentRole
    let currentOrganization
    let cycles

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

    if (data.catalogItems) {
      const catalogItems = await CatalogItem.filterByUserRole(
        { uuid: { $in: data.catalogItems } },
        currentRole.slug,
        user
      )
      initialMatch['catalogItems'] = { $in: catalogItems }
    }

    let matchPreviousSale = _.cloneDeep(initialMatch)

    let start = moment(data.date_start, 'YYYY-MM-DD').utc()
    let end = moment(data.date_end, 'YYYY-MM-DD').utc()

    const periods = await Period.getBetweenDates(
      currentOrganization.organization._id,
      currentRule._id,
      start.toDate(),
      end.toDate()
    )

    cycles = await Cycle.getBetweenDates(
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

    let previousPeriods = await Period.getBetweenDates(
      currentOrganization.organization._id,
      currentRule._id,
      start.toDate(),
      end.toDate()
    )
    matchPreviousSale['period'] = {
      $in: previousPeriods.map(item => { return item._id })
    }

    const key = {
      cycle: '$cycle',
      period: '$period'
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
    }]

    let responseData = await DataSetRow.aggregate(match)
    let previousSale = await DataSetRow.aggregate(matchPreviousSale)
    previousSale = await Cycle.populate(previousSale, {
      path: '_id.cycle'
    })
    previousSale = await Period.populate(previousSale, {
      path: '_id.period'
    })

    let previousSaleDict = {}
    for (let prev of previousSale) {
      previousSaleDict[`${prev._id.cycle.cycle}-${prev._id.period.period}`] = prev
    }

    let saleDict = {}
    for (let res of responseData) {
      saleDict[res._id.period] = res
    }

    let totalPrediction = 0
    let totalSale = 0
    let response = []

    for (let date of periods) {
      let dateStart = moment(date.dateStart).utc().format('YYYY-MM-DD')
      let item = {
        date: dateStart,
        prediction: 0,
        adjustment: 0,
        sale: 0,
        previousSale: 0
      }

      if (saleDict[date._id]) {
        item.prediction = saleDict[date._id].prediction
        item.adjustment = saleDict[date._id].adjustment
        item.sale = saleDict[date._id].sale
      }

      if (item.prediction && item.sale) {
        totalPrediction += item.prediction
        totalSale += item.sale
      }

      let lastDate = previousPeriods.find(cycle => {
        return cycle.period === date.period && cycle.cycle.cycle === date.cycle.cycle
      })

      if (lastDate && previousSaleDict[`${lastDate.cycle.cycle}-${lastDate.period}`]) {
        item.previousSale = previousSaleDict[`${lastDate.cycle.cycle}-${lastDate.period}`].sale
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
