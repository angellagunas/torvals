const ObjectId = require('mongodb').ObjectID
const Route = require('lib/router/route')

const { DataSetRow, Project } = require('models')

module.exports = new Route({
  method: 'get',
  path: '/projects',
  handler: async function (ctx) {
    var data = ctx.request.query
    var projectsUuid = Object.values(data).map(item => { return item })
    var filters = {
      organization: ctx.state.organization,
      activeDataset: { $ne: undefined }
    }

    if (projectsUuid && projectsUuid.length > 0) {
      filters['uuid'] = { $in: projectsUuid }
    }

    const projects = await Project.find(filters)
    const datasets = projects.map(item => { return item.activeDataset })

    var statement = [
      {
        '$match': {
          'dataset': {
            '$in': datasets
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

    ctx.set('Cache-Control', 'max-age=172800')

    ctx.body = {
      channels: datasetRow[0].channels,
      products: datasetRow[0].products,
      salesCenters: datasetRow[0].salesCenters
    }
  }
})
