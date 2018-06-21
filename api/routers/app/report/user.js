const Route = require('lib/router/route')
const _ = require('lodash')
const { UserReport, User } = require('models')

module.exports = new Route({
  method: 'post',
  path: '/user/',
  handler: async function (ctx) {
    var data = ctx.request.body

    let initialMatch = {}
    if (data.users) {
      initialMatch['userInfo.uuid'] = {
        '$in': data.users
      }
    }

    if (data.projects) {
      initialMatch['projectInfo.uuid'] = {
        '$in': data.projects
      }
    }

    if (data.cycles) {
      initialMatch['cycleInfo.uuid'] = {
        '$in': data.projects
      }
    }

    var statement = [
      {
        '$lookup': {
          'from': 'users',
          'localField': 'user',
          'foreignField': '_id',
          'as': 'userInfo'
        }
      },
      {
        '$lookup': {
          'from': 'projects',
          'localField': 'project',
          'foreignField': '_id',
          'as': 'projectInfo'
        }
      },
      {
        '$lookup': {
          'from': 'cycles',
          'localField': 'cycle',
          'foreignField': '_id',
          'as': 'cycleInfo'
        }
      },
      {
        '$match': { ...initialMatch }
      },
      {
        '$group': {
          '_id': {
            'status': '$status'
          },
          'count': {
            '$sum': 1.0
          },
          'users': {
            '$addToSet': '$userInfo.uuid'
          }
        }
      }
    ]

    const stats = await UserReport.aggregate(statement)
    let activeUsers = []
    let report = {}
    for (let stat of stats) {
      for (let user of stat.users) {
        activeUsers.push(user[0])
      }
      report[stat._id.status] = stat.count
    }

    if (!data.users) {
      let users = await User.find({'organizations.organization': ctx.state.organization})
      data.users = users.map((item) => {
        return item.uuid
      })
    }
    const inactiveUsers = _.difference(data.users, activeUsers)
    report['inactive'] = inactiveUsers.length

    ctx.body = {
      data: report
    }
  }
})
