const Route = require('lib/router/route')
const ObjectId = require('mongodb').ObjectID

const {Channel, Role, Group} = require('models')

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
      { '$match':
        { 'isDeleted': false }
      }
    ]

    var statementsGeneral = []
    for (var filter in ctx.request.query) {
      if (filter === 'general') {
        for (var column of columns) {
          var fil = {}
          if (!isNaN(ctx.request.query[filter]) && column.type === 'Number') {
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
      } else if (filter === 'group') {
        let group = await Group.findOne({ uuid: ctx.request.query[filter] })
        let channelsList = []

        channelsList = await Channel.find({ groups: group._id })
        statement.push({ '$match': { '_id': { $in: channelsList.map(item => { return item._id }) } } })
      }
    }

    var statementNoSkip = statement.slice()
    statement.push({ '$skip': parseInt(ctx.request.query.start) || 0 })

    if (ctx.state.organization) {
      statement.push({ '$match': { 'organization': { $in: [ObjectId(ctx.state.organization._id)] } } })
      statementNoSkip.push({ '$match': { 'organization': { $in: [ObjectId(ctx.state.organization._id)] } } })
    }

    const user = ctx.state.user
    var currentRole
    const currentOrganization = user.organizations.find(orgRel => {
      return ctx.state.organization._id.equals(orgRel.organization._id)
    })

    if (currentOrganization) {
      const role = await Role.findOne({_id: currentOrganization.role})

      currentRole = role.toPublic()
    }

    if (
        currentRole.slug === 'manager-level-1' ||
        currentRole.slug === 'manager-level-2' ||
        currentRole.slug === 'supervisor'
    ) {
      var groups = user.groups
      var channelsList = []

      channelsList = await Channel.find({groups: {$in: groups}})
      statement.push({ '$match': { '_id': { $in: channelsList.map(item => { return item._id }) } } })
    }

    var general = {}
    if (statementsGeneral.length > 0) {
      general = { '$match': { '$or': statementsGeneral } }
      statement.push(general)
      statementNoSkip.push(general)
    }

    var statementCount = [...statementNoSkip]

    statement.push({ '$limit': parseInt(ctx.request.query['limit']) || 20 })
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
