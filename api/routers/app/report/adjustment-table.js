const Route = require('lib/router/route')
const { DataSetRow, User, Project, CatalogItem, Cycle, AdjustmentRequest } = require('models')
const _ = require('lodash')

module.exports = new Route({
  method: 'post',
  path: '/adjustments/',
  handler: async function (ctx) {
    var data = ctx.request.body

    let initialMatch = {}
    let midMatch = {}

    let projects = await Project.find({uuid: {$in: data.projects}})
    let projectsIds = projects.map((item) => {
      return item._id
    })
    initialMatch['project'] = {
      '$in': projectsIds
    }

    if (data.users) {
      let users = await User.find({uuid: {$in: data.users}})
      let usersIds = users.map((item) => {
        return item._id
      })
      let adjustmentsReq = await AdjustmentRequest.find({
        requestedBy: {
          '$in': usersIds
        },
        project: {
          '$in': projectsIds
        }
      })

      let adjustmentsIds = adjustmentsReq.map((item) => {
        return item._id
      })

      initialMatch['$or'] = [
        {adjustmentRequest: {'$in': adjustmentsIds}},
        {updatedBy: {'$in': usersIds}}
      ]

      midMatch['$or'] = [
        {'adjustmentRequest.requestedBy': {$in: usersIds}},
        {updatedBy: {'$in': usersIds}, 'adjustmentRequest.requestedBy': null}
      ]
    }

    if (data.cycles) {
      let cycles = await Cycle.find({uuid: {$in: data.cycles}})
      let cyclesIds = cycles.map((item) => {
        return item._id
      })
      initialMatch['cycle'] = {
        '$in': cyclesIds
      }
    }

    if (data.catalogItems) {
      let catalogItems = await CatalogItem.find({uuid: {$in: data.catalogItems}})
      let catalogItemsIds = await catalogItems.map((item) => {
        return item._id
      })
      initialMatch['catalogItems'] = {
        '$in': catalogItemsIds
      }
    }

    var statement = [
      {
        '$match': {
          ...initialMatch,
          $or: [
            {updatedBy: {$ne: null}},
            {adjustmentRequest: {$ne: null}}
          ]
        }
      },
      {
        '$lookup': {
          'from': 'users',
          'localField': 'updatedBy',
          'foreignField': '_id',
          'as': 'userInfo'
        }
      },
      {
        '$lookup': {
          'from': 'adjustmentrequests',
          'localField': '_id',
          'foreignField': 'datasetRow',
          'as': 'adjustmentRequest'
        }
      },
      {
        '$unwind': {
          'path': '$adjustmentRequest',
          'preserveNullAndEmptyArrays': true
        }
      },
      {
        '$match': {
          ...midMatch
        }
      },
      {
        '$group': {
          '_id': {
            'user': {
              '$ifNull': [
                '$adjustmentRequest.requestedBy',
                '$updatedBy'
              ]
            }
          },
          'total': {
            '$sum': 1.0
          },
          'approved': {
            '$sum': {
              '$cond': [
                {
                  '$eq': [
                    '$adjustmentRequest.status',
                    'approved'
                  ]
                },
                1.0,
                0.0
              ]
            }
          },
          'created': {
            '$sum': {
              '$cond': [
                {
                  '$eq': [
                    '$adjustmentRequest.status',
                    'created'
                  ]
                },
                1.0,
                0.0
              ]
            }
          },
          'rejected': {
            '$sum': {
              '$cond': [
                {
                  '$eq': [
                    '$adjustmentRequest.status',
                    'rejected'
                  ]
                },
                1.0,
                0.0
              ]
            }
          }
        }
      },
      {
        '$lookup': {
          from: 'users',
          localField: '_id.user',
          foreignField: '_id',
          as: 'user'
        }
      }
    ]

    const stats = await DataSetRow.aggregate(statement)
    let foundUsers = stats.map(item => {
      return item.user[0].uuid
    })

    let inactiveUsers = _.difference(data.users, foundUsers)
    const inactives = await User.find({uuid: {$in: inactiveUsers}})

    if (inactives && inactives.length) {
      for (let inactive of inactives) {
        stats.push({
          approved: 0,
          created: 0,
          rejected: 0,
          total: 0,
          user: [inactive]
        })
      }
    }
    ctx.body = {
      data: stats
    }
  }
})
