const ObjectId = require('mongodb').ObjectID
const Route = require('lib/router/route')

const { DataSetRow } = require('models')

module.exports = new Route({
  method: 'get',
  path: '/projects',
  handler: async function (ctx) {
    var data = ctx.request.query
    var projectsUuid = Object.values(data).map(item => { return ObjectId(item) })

    projectsUuid = projectsUuid.map(item => {
      return ObjectId(item)
    })

    var statement = [
      {
        '$match': {
          'dataset': {
            '$in': projectsUuid
          },
          'isDeleted': false
        }
      },
      {
        '$group': {
          '_id': null,
          'channel': {
            '$addToSet': '$channel'
          },
          'salesCenter': {
            '$addToSet': '$salesCenter'
          },
          'product': {
            '$addToSet': '$product'
          }
        }
      },
      {
        '$lookup': {
          'from': 'channels',
          'localField': 'channel',
          'foreignField': '_id',
          'as': 'channels'
        }
      },
      {
        '$lookup': {
          'from': 'salescenters',
          'localField': 'salesCenter',
          'foreignField': '_id',
          'as': 'salesCenters'
        }
      },
      {
        '$lookup': {
          'from': 'products',
          'localField': 'product',
          'foreignField': '_id',
          'as': 'products'
        }
      }
    ]

    var datasetRow = await DataSetRow.aggregate(statement)

    ctx.body = {
      channels: datasetRow[0].channels,
      products: datasetRow[0].products,
      salesCenters: datasetRow[0].salesCenters
    }
  }
})
