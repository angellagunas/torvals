const ObjectId = require('mongodb').ObjectID
const Route = require('lib/router/route')

const {Channel, Organization} = require('models')

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
          } else {
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
      } else if (filter === 'organization') {
        const organization = await Organization.findOne({'uuid': ctx.request.query[filter]})
        statement.push({ '$match': { 'organization': { $in: [ObjectId(organization._id)] } } })
      }
    }
    statement.push({ '$skip': parseInt(ctx.request.query.start) })

    var general = {}
    if (statementsGeneral.length > 0) {
      general = { '$match': { '$or': statementsGeneral } }
      statement.push(general)
    }

    var statementCount = [...statement]

    if (parseInt(ctx.request.query['limit'])) { statement.push({ '$limit': parseInt(ctx.request.query['limit']) || 20 }) }
    var channels = await Channel.aggregate(statement)

    statementCount.push({$count: 'total'})
    var channelsCount = await Channel.aggregate(statementCount)
    channels = channels.map((channel) => {
      return { ...channel,
        organization: channel.infoOrganization
      }
    })
    ctx.body = {'data': channels, 'total': channelsCount[0] ? channelsCount[0].total : 0}
  }
})
