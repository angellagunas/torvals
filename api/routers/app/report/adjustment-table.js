const Route = require('lib/router/route')
const { DataSetRow } = require('models')

module.exports = new Route({
  method: 'post',
  path: '/adjustments/',
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
        '$in': data.cycles
      }
    }

    if (data.catalogItems) {
      initialMatch['catalogInfo.uuid'] = {
        '$in': data.catalogItems
      }
    }

    var statement = [
      {
        '$match': {
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
        '$lookup': {
          'from': 'users',
          'localField': 'updatedBy',
          'foreignField': '_id',
          'as': 'userInfo'
        }
      },
      {
        '$lookup': {
          'from': 'catalogitems',
          'localField': 'catalogItems',
          'foreignField': '_id',
          'as': 'catalogInfo'
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
        '$match': {
          ...initialMatch
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
