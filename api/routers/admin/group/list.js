const ObjectId = require('mongodb').ObjectID
const Route = require('lib/router/route')

const {Group, User, SalesCenter} = require('models')

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
        statement.push({ '$match': { 'organization': { $in: [ObjectId(ctx.request.query[filter])] } } })
      } else if (filter === 'user') {
        const user = await User.findOne({'uuid': ctx.request.query[filter]})
        if (user) {
          statement.push({ '$match': { 'users': { $nin: [ObjectId(user._id)] } } })
        } else if (filter === 'user_orgs') {
          const user = await User.findOne({'uuid': ctx.request.query[filter]})
          if (user) {
            statement.push({ '$match': { 'organization': user.organizations.map(item => { return item.organization }) } })
          }
        } else if (filter === 'salesCenter') {
          const salesCenter = await SalesCenter.findOne({'uuid': ctx.request.query[filter]}).populate('organization')
          if (salesCenter) {
            statement.push({ '$match': {'organization': [salesCenter.organization._id]} })
          }
        }
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
    var groups = await Group.aggregate(statement)

    statementCount.push({$count: 'total'})
    var groupsCount = await Group.aggregate(statementCount)
    groups = groups.map((channel) => {
      return { ...channel,
        organization: channel.infoOrganization
      }
    })
    ctx.body = {'data': groups, 'total': groupsCount[0] ? groupsCount[0].total : 0}
  }
})
