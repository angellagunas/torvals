const Route = require('lib/router/route')
const _ = require('lodash')
const {
  UserReport,
  User,
  Cycle,
  Project,
  Group,
  Role
} = require('models')

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

    let invalidCatalogs = ['5b71e9abc2eb13002b7a700b', '5b71ea41e8ca55002673973c', '5b71ea8be8ca55002673973d']
    let groupIds = ctx.state.user.groups.filter((item) => {return !invalidCatalogs.includes(String(item)) })
    const groups = groupIds.map((group) => {return String(group)})

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

    const filterStatus = data.status
    const anyStatus = filterStatus === '0'
    let users = []

    if (finishedUsers.length > 0 && (anyStatus || filterStatus === '1')) {
      const finishedUsersItems = await User.find({
        isDeleted: false,
        uuid: { $in: finishedUsers }
      })
      const newFinishedUsers = []
      for (let finishedUser of finishedUsersItems) {
        newFinishedUsers.push({
          ...finishedUser._doc,
          status: 'Finalizado'
        })
      }
      users = [
        ...users,
        ...newFinishedUsers
      ]
    }

    if (inProgressUsers.length > 0 && (anyStatus || filterStatus === '2')) {
      const inProgressUsersItems = await User.find({
        isDeleted: false,
        uuid: { $in: inProgressUsers }
      })
      const newInProgressUsers = []
      for (let inProgressUser of inProgressUsersItems) {
        newInProgressUsers.push({
          ...inProgressUser._doc,
          status: 'En proceso'
        })
      }
      users = [
        ...users,
        ...newInProgressUsers
      ]
    }

    if (inactiveUsers.length > 0 && (anyStatus || filterStatus === '3')) {
      const inactiveUsersItems = await User.find({
        isDeleted: false,
        uuid: { $in: inactiveUsers }
      })
      const newInactiveUsers = []
      for (let inactiveUser of inactiveUsersItems) {
        newInactiveUsers.push({
          ...inactiveUser._doc,
          status: 'Sin ajustes'
        })
      }
      users = [
        ...users,
        ...newInactiveUsers
      ]
    }

    const roles = data.sendRoles ? await Role.find({ isDeleted: false }) : []
    const groupsItems = data.sendGroups ? await Group.find({
      organization: ctx.state.organization,
      isDeleted: false
    }) : []

    ctx.body = {
      data: users,
      groups: groupsItems,
      roles
    }
  }
})
