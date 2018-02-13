const ObjectId = require('mongodb').ObjectID
const Route = require('lib/router/route')
const {SalesCenter, Organization, Forecast, Prediction} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/',
  handler: async function (ctx) {
    var sortStatement = {}
    var columns = [
      {name: 'name', type: 'String'},
      {name: 'infoOrganization.name', type: 'String'}
    ]
    var statement = [
      { '$match':
        { 'isDeleted': false }
      },
      { '$lookup':
        { 'localField': 'organization', 'from': 'organizations', 'foreignField': '_id', 'as': 'infoOrganization' } },
      { '$unwind': '$infoOrganization' }
    ]

    var statementsGeneral = []
    for (var filter in ctx.request.query) {
      var flagNumber = false
      if (!isNaN(ctx.request.query[filter])) {
        flagNumber = true
      }
      if (filter === 'general') {
        if (!isNaN(ctx.request.query[filter])) {
          flagNumber = true
        }

        for (var column of columns) {
          var fil = {}
          if (flagNumber && column.type === 'Number') {
            fil[column.name] = {
              '$gt': parseInt(ctx.request.query[filter] - column.limit),
              '$lt': parseInt(ctx.request.query[filter]) + column.limit
            }
            statementsGeneral.push(fil)
          } else if (!flagNumber && column.type === 'String') {
            fil[column.name] = {$regex: ctx.request.query[filter], $options: 'i'}
            statementsGeneral.push(fil)
          }
        }
      } else if (filter === 'sort') {
        var filterSort = ctx.request.query.sort.split('-')
        if (ctx.request.query.sort.split('-').length > 1) {
          sortStatement[filterSort[1]] = -1
        } else {
          sortStatement[filterSort[0]] = 1
        }
        statement.push({ '$sort': sortStatement })
      } else if (filter === 'predictions') {
        const forecast = await Forecast.findOne({'uuid': ctx.request.query[filter]})

        if (forecast) {
          const predictions = await Prediction.find({'forecast': ObjectId(forecast._id)}).populate('salesCenter')
          statement.push({'$match': { '_id': { $in: predictions.map(item => { return item.salesCenter._id }) } }})
        }
      } else if (filter === 'organization') {
        const organization = await Organization.findOne({'uuid': ctx.request.query[filter]})
        statement.push({ '$match': { 'organizations.organization': { $in: [ObjectId(organization._id)] } } })
      }
    }
    statement.push({ '$skip': parseInt(ctx.request.query.start) })

    var general = {}
    if (statementsGeneral.length > 0) {
      general = { '$match': { '$or': statementsGeneral } }
      statement.push(general)
    }

    var statementCount = [...statement]

    statement.push({ '$limit': parseInt(ctx.request.query['limit']) || 20 })
    var salesCenter = await SalesCenter.aggregate(statement)

    statementCount.push({$count: 'total'})
    var salesCenterCount = await SalesCenter.aggregate(statementCount) || 0

    salesCenter = salesCenter.map((sc) => {
      return {
        ...sc,
        organization: sc.infoOrganization
      }
    })
    ctx.body = {'data': salesCenter, 'total': salesCenterCount[0] ? salesCenterCount[0].total : 0}
  }
})
