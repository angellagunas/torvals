const ObjectId = require('mongodb').ObjectID
const Route = require('lib/router/route')
const {User, Role, Group} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/',
  handler: async function (ctx) {
    var sortStatement = {}

    var columns = [
      {name: 'name', type: 'String'},
      {name: 'email', type: 'String'},
      {name: 'infoRole.name', type: 'String'}
    ]
    var statement = [
      { '$match':
        { 'isDeleted': false }
      },
      { '$lookup':
        { 'localField': 'groups', 'from': 'groups', 'foreignField': '_id', 'as': 'infoGroup' }
      },
      { '$lookup':
        { 'localField': 'organizations.role', 'from': 'roles', 'foreignField': '_id', 'as': 'infoRole' }
      },
      {
        '$unwind': {
          'path': '$organizations'
        }
      },
      {
        '$match': {
          'organizations.organization': ObjectId(ctx.state.organization._id)
        }
      },
      {
        '$unwind': {
          'path': '$infoRole'
        }
      },
      {
        '$project': {
          'areEqual': {
            '$eq': [
              '$organizations.role',
              '$infoRole._id'
            ]
          },
          'doc': '$$ROOT'
        }
      },
      {
        '$match': {
          'areEqual': true
        }
      }
    ]

    var statementsGeneral = []
    for (var filter in ctx.request.query) {
      if (filter === 'general') {
        for (var column of columns) {
          var fil = {}
          if (!isNaN(ctx.request.query[filter]) && column.type === 'Number') {
            fil['doc.' + column.name] = {
              '$gt': parseInt(ctx.request.query[filter] - column.limit),
              '$lt': parseInt(ctx.request.query[filter]) + column.limit
            }
            statementsGeneral.push(fil)
          } else {
            fil['doc.' + column.name] = {$regex: ctx.request.query[filter], $options: 'i'}
            statementsGeneral.push(fil)
          }
        }
      } else if (filter === 'sort') {
        var filterSort = ctx.request.query.sort.split('-')
        if (ctx.request.query.sort.split('-').length > 1) {
          if (filterSort[1] === 'role') {
            sortStatement['doc.infoRole.name'] = -1
          } else {
            sortStatement['doc.infoRole.name'] = -1
          }
        } else {
          if (filterSort[0] === 'role') {
            sortStatement['doc.infoRole.name'] = 1
          } else {
            sortStatement['doc.infoRole.name'] = 1
          }
        }
        statement.push({ '$sort': sortStatement })
      } else if (filter === 'role') {
        const role = await Role.findOne({'uuid': ctx.request.query[filter]})
        statement.push({ '$match': { 'doc.organizations.role': { $in: [ObjectId(role._id)] } } })
      } else if (filter === 'group') {
        const group = await Group.findOne({'uuid': ctx.request.query[filter]})
        statement.push({ '$match': { 'doc.groups': { $in: [ObjectId(group._id)] } } })
      } else if (filter === 'groupAsign') {
        const group = await Group.findOne({'uuid': ctx.request.query[filter]})
        statement.push({ '$match': { 'doc.groups': { $nin: [ObjectId(group._id)] } } })
      }
    }

    statement.push({ '$skip': parseInt(ctx.request.query.start) || 0 })

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
        uuid: user.doc.uuid,
        screenName: user.doc.screenName,
        displayName: user.doc.displayName,
        name: user.doc.name,
        email: user.doc.email,
        isAdmin: user.doc.isAdmin,
        validEmail: user.doc.validEmail,
        organizations: user.doc.organizations,
        groups: user.doc.infoGroup,
        profileUrl: user.doc.profileUrl,
        role: user.doc.infoRole ? user.doc.infoRole.name : '',
        roleDetail: user.doc.infoRole
      }
    })
    ctx.body = {'data': users, 'total': usersCount[0] ? usersCount[0].total : 0}
  }
})
