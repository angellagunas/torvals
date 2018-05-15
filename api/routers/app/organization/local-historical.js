const Route = require('lib/router/route')
const { Project, DataSetRow, Channel, SalesCenter, Product, AbraxasDate, Role } = require('models')
const ObjectId = require('mongodb').ObjectID
const moment = require('moment')
const _ = require('lodash')

module.exports = new Route({
  method: 'post',
  path: '/local/historical',
  handler: async function (ctx) {
    var data = ctx.request.body
    var user = ctx.state.user
    var currentRole
    var currentOrganization
    if (ctx.state.organization) {
      currentOrganization = user.organizations.find(orgRel => {
        return ctx.state.organization._id.equals(orgRel.organization._id)
      })

      if (currentOrganization) {
        const role = await Role.findOne({_id: currentOrganization.role})

        currentRole = role.toPublic()
      }
    }
    var filters = {
      organization: ctx.state.organization,
      activeDataset: {$ne: undefined}
    }

    if (data.projects && data.projects.length > 0) {
      filters['uuid'] = {$in: data.projects}
    }

    const projects = await Project.find(filters)
    const datasets = projects.map(item => { return item.activeDataset })

    const key = {week: '$data.semanaBimbo', date: '$data.forecastDate'}

    var initialMatch = {
      dataset: { $in: datasets }
    }

    if (data.channels) {
      var channels = await Channel.find({ uuid: { $in: data.channels } }).select({'_id': 1, 'groups': 1})
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
      var salesCenters = await SalesCenter.find({ uuid: { $in: data.salesCenters } }).select({'_id': 1, 'groups': 1})
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
    var matchPreviousSale = _.cloneDeep(initialMatch)

    if (data.date_start && data.date_end) {
      const weeks = await AbraxasDate.find({ $and: [{dateStart: {$gte: data.date_start}}, {dateEnd: {$lte: data.date_end}}] })
      data.weeks = []
      data.dates = []
      for (let week of weeks) {
        data.weeks.push(week.week)
        data.dates[week.week] = week.dateStart
      }

      data.year = moment(data.date_start).year()

      initialMatch['data.semanaBimbo'] = {$in: data.weeks}

      var lastYear = data.year - 1
      matchPreviousSale['data.semanaBimbo'] = {$in: data.weeks}
    } else {
      ctx.throw(400, '¡Es necesario filtrarlo por un rango de fechas!')
    }

    var match = [
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

    match.push({ $sort: { '_id.date': 1 } })
    matchPreviousSale.push({ $sort: { '_id.date': 1 } })

    var responseData = await DataSetRow.aggregate(match)
    var previousSale = await DataSetRow.aggregate(matchPreviousSale)
    var previousSaleDict = {}

    for (var prev of previousSale) {
      previousSaleDict[prev._id.week] = prev
    }

    var totalPrediction = 0
    var totalSale = 0

    responseData = responseData.map(item => {
      if (item.prediction && item.sale) {
        totalPrediction += item.prediction
        totalSale += item.sale
      }

      if (previousSaleDict[item._id.week]) {
        _.pull(data.weeks, item._id.week)
      }

      return {
        date: item._id.date,
        week: item._id.week,
        prediction: item.prediction,
        adjustment: item.adjustment,
        sale: item.sale,
        previousSale: previousSaleDict[item._id.week] ? previousSaleDict[item._id.week].sale : 0
      }
    })

    for (let week of data.weeks) {
      if (previousSaleDict[week]) {
        responseData.push({
          date: data.dates[week],
          week: 0,
          prediction: 0,
          adjustment: 0,
          sale: 0,
          previousSale: previousSaleDict[week].sale
        })
      }
    }

    let mape = 0

    if (totalSale !== 0) {
      mape = Math.abs((totalSale - totalPrediction) / totalSale)
    }

    ctx.set('Cache-Control', 'max-age=86400')

    ctx.body = {
      data: responseData,
      mape: mape
    }
  }
})
