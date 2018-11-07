const Route = require('lib/router/route')
const _ = require('lodash')
const { UserReport, User, Cycle, Project } = require('models')

module.exports = new Route({
  method: 'post',
  path: '/user/',
  handler: async function (ctx) {
    var data = ctx.request.body

    let initialMatch = {}

    if (data.users) {
      const users = await User.find({uuid: {$in: data.users}})
      let usersIds = users.map((item) => {
        return item._id
      })
      initialMatch['user'] = {
        '$in': usersIds
      }
    }

    if (data.projects) {
      const projects = await Project.find({uuid: {$in: data.projects}})
      let projectsIds = projects.map((item) => {
        return item._id
      })
      initialMatch['project'] = {
        '$in': projectsIds
      }
    }

    if (data.cycles) {
      const cycles = await Cycle.find({uuid: {$in: data.cycles}})
      let cyclesIds = cycles.map((item) => {
        return item._id
      })
      initialMatch['cycle'] = {
        '$in': cyclesIds
      }
    }

    var statement = [
      {
        '$match': { ...initialMatch }
      },
      {
        '$lookup': {
          'from': 'users',
          'localField': 'user',
          'foreignField': '_id',
          'as': 'userInfo'
        }
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
    let finishedUsers = []
    let inProgressUsers = []
    let report = {}
    for (let stat of stats) {
      for (let user of stat.users) {
        if (stat._id.status === 'finished') {
          finishedUsers.push(user[0])
        } else {
          inProgressUsers.push(user[0])
        }
      }
      report[stat._id.status] = stat.count
    }

    const groups = ctx.state.user.groups.map((group) => {return String(group)})
    if (!data.users) {
      let users = await User.find({'organizations.organization': ctx.state.organization, groups: {$in: groups}})
      data.users = users.map((item) => {
        return item.uuid
      })
    }
    const inactiveUsers = _.difference(data.users, [...finishedUsers, ...inProgressUsers])
    report['inactive'] = inactiveUsers.length

    report['inactiveUsers'] = inactiveUsers
    report['finishedUsers'] = finishedUsers
    report['inProgressUsers'] = inProgressUsers

    ctx.body = {
      data: report
    }
  }
})
