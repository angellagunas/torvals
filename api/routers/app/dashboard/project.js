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
      mainDataset: { $ne: undefined }
    }

    if (projectsUuid && projectsUuid.length > 0) {
      filters['uuid'] = { $in: projectsUuid }
    }

    const projects = await Project.find(filters)

    const datasets = projects.map(item => { return item.mainDataset })

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
    if (
        currentRole.slug === 'manager-level-1' ||
        currentRole.slug === 'manager-level-2' ||
        currentRole.slug === 'supervisor'
    ) {
      var userGroups = []
      for (var g of user.groups) {
        userGroups.push(ObjectId(g))
      }

      const salesCenters = await SalesCenter.find({groups: {$all: userGroups}}).select({'_id': 1})
      const matchSalesCenters = salesCenters.map(item => { return item._id })

      const channels = await Channel.find({groups: {$all: userGroups}}).select({'_id': 1})
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
        '$unwind': {
          'path': '$catalogItems'
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
          },
          'catalogItem': {
            '$addToSet': '$catalogItems'
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
      },
      {
        '$lookup': {
          'from': 'catalogitems',
          'localField': 'catalogItem',
          'foreignField': '_id',
          'as': 'catalogItems'
        }
      }
    ]

    var datasetRow = await DataSetRow.aggregate(statement)

    ctx.body = {
      channels: datasetRow[0].channels,
      products: datasetRow[0].products,
      salesCenters: datasetRow[0].salesCenters,
      catalogItems: datasetRow[0].catalogItems
    }
  }
})
