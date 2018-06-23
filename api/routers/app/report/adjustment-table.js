const Route = require('lib/router/route')
const { DataSetRow, User, Project, CatalogItem, Cycle } = require('models')

module.exports = new Route({
  method: 'post',
  path: '/adjustments/',
  handler: async function (ctx) {
    var data = ctx.request.body

    let initialMatch = {}
    if (data.users) {
      let users = await User.find({uuid: {$in: data.users}})
      let usersIds = users.map((item) => {
        return item._id
      })
      initialMatch['updatedBy'] = {
        '$in': usersIds
      }
    }

    if (data.projects) {
      let projects = await Project.find({uuid: {$in: data.projects}})
      let projectsIds = projects.map((item) => {
        return item._id
      })
      initialMatch['project'] = {
        '$in': projectsIds
      }
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
          'status': {
            '$ne': 'unmodified'
          },
          'updatedBy': {
            '$ne': null
          }
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
        '$group': {
          '_id': {
            'user': '$updatedBy'
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
          },
          user: {$addToSet: {$arrayElemAt: ['$userInfo', 0]}}
        }
      }
    ]

    const stats = await DataSetRow.aggregate(statement)

    ctx.body = {
      data: stats
    }
  }
})
