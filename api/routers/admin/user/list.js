const ObjectId = require('mongodb').ObjectID
const Route = require('lib/router/route')
const {User, Organization, Role, Group} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/',
  handler: async function (ctx) {
    var sortStatement = {}

    var columns = [
      {name: 'name', type: 'String'},
      {name: 'email', type: 'String'}
    ]
    var statement = [
      { '$unwind': {path: '$groups', preserveNullAndEmptyArrays: true} },
      { '$match':
        { 'isDeleted': false }
      },
      { '$lookup':
        { 'localField': 'groups', 'from': 'groups', 'foreignField': '_id', 'as': 'infoGroup' } }
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
      } else if (filter === 'role') {
        const role = await Role.findOne({'uuid': ctx.request.query[filter]})
        statement.push({ '$match': { 'organizations.role': { $in: [ObjectId(role._id)] } } })
      } else if (filter === 'organization') {
        const organization = await Organization.findOne({'uuid': ctx.request.query[filter]})
        statement.push({ '$match': { 'organizations.organization': { $in: [ObjectId(organization._id)] } } })
      } else if (filter === 'group') {
        const group = await Group.findOne({'uuid': ctx.request.query[filter]})
        statement.push({ '$match': { 'groups': { $in: [ObjectId(group._id)] } } })
      } else if (filter === 'groupAsign') {
        const group = await Group.findOne({'uuid': ctx.request.query[filter]})
        statement.push({ '$match': { 'groups': { $nin: [ObjectId(group._id)] } } })
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
    var users = await User.aggregate(statement)

    statementCount.push({$count: 'total'})
    var usersCount = await User.aggregate(statementCount) || 0

    users = users.map((user) => {
      return {
        uuid: user.uuid,
        screenName: user.screenName,
        displayName: user.displayName,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        validEmail: user.validEmail,
        organizations: user.organizations,
        groups: user.infoGroup,
        profileUrl: user.profileUrl
      }
    })
    ctx.body = {'data': users, 'total': usersCount[0] ? usersCount[0].total : 0}
  }
})
