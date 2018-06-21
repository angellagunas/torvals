const Route = require('lib/router/route')

const {UserReport} = require('models')

module.exports = new Route({
  method: 'post',
  path: 'user',
  handler: async function (ctx) {
    var data = ctx.request.body

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
        '$match': {
          'userInfo.uuid': {
            '$in': [
              'ff0d7b08-1a05-4044-8109-0bda619d360d',
              'b687560a-93a1-4fa4-94f3-a7a4f629a6a5'
            ]
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
        '$match': {
          'projectInfo.uuid': {
            '$in': [
              '6b9d4734-4280-42a3-9d3b-f0fd5262a04b'
            ]
          }
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
        '$match': {
          'cycleInfo.uuid': {
            '$in': [
              'c133e5bd-ecd7-409d-ba85-522cfc513c8c'
            ]
          }
        }
      },
      {
        '$group': {
          '_id': {
            'status': '$status'
          },
          'count': {
            '$sum': 1.0
          }
        }
      }
    ]

    ctx.body = {

    }
  }
})
