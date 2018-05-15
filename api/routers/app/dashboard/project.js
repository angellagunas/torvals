const Route = require('lib/router/route')
const _ = require('lodash')
const ObjectId = require('mongodb').ObjectID

const { DataSetRow, Project, Role, SalesCenter, Channel } = require('models')

module.exports = new Route({
  method: 'get',
  path: '/projects',
  handler: async function (ctx) {
    var data = ctx.request.query
    var projectsUuid = Object.values(data).map(item => { return item })
    const user = ctx.state.user

    var filters = {
      organization: ctx.state.organization,
      activeDataset: { $ne: undefined }
    }

    if (projectsUuid && projectsUuid.length > 0) {
      filters['uuid'] = { $in: projectsUuid }
    }

    const projects = await Project.find(filters)

    const datasets = projects.map(item => { return item.activeDataset })

    var currentRole
    var currentOrganization
    if (ctx.state.organization) {
      currentOrganization = user.organizations.find(orgRel => {
        return ctx.state.organization._id.equals(orgRel.organization._id)
      })

      if (currentOrganization) {
        const role = await Role.findOne({_id: currentOrganization.role})

        currentRole = role.toPublic()
      }
    }

    var matchCond
    if (currentRole.slug === 'manager-level-2') {
      var userGroups = []
      for (var g of user.groups) {
        userGroups.push(ObjectId(g))
      }

      const salesCenters = await SalesCenter.find({groups: {$in: userGroups}}).select({'_id': 1})
      const matchSalesCenters = salesCenters.map(item => { return item._id })

      const channels = await Channel.find({groups: {$in: userGroups}}).select({'_id': 1})
      const matchChannels = channels.map(item => { return item._id })
      matchCond = {
        '$match': {
          'dataset': {
            '$in': datasets
          },
          'isDeleted': false,
          'salesCenter': {
            $in: matchSalesCenters
          },
          'channel': {
            $in: matchChannels
          }
        }
      }
    } else {
      matchCond = {
        '$match': {
          'dataset': {
            '$in': datasets
          },
          'isDeleted': false

        }
      }
    }

    var statement = [
      matchCond,
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

    ctx.set('Cache-Control', 'max-age=86400')

    ctx.body = {
      channels: datasetRow[0].channels,
      products: datasetRow[0].products,
      salesCenters: datasetRow[0].salesCenters
    }
  }
})
