const Route = require('lib/router/route')
const _ = require('lodash')
const ObjectId = require('mongodb').ObjectID

const { DataSetRow, Project, Role, CatalogItem, Rule, Group } = require('models')

module.exports = new Route({
  method: 'get',
  path: '/projects',
  handler: async function (ctx) {
    let data = ctx.request.query
    let projectsUuid = Object.values(data).map(item => { return item })
    const user = ctx.state.user
    const groups = await Group.findOne({_id: {$in: user.groups.map((item) => {return ObjectId(item)})}})

    let filters = {
      organization: ctx.state.organization,
      mainDataset: { $ne: undefined }
    }

    if (projectsUuid && projectsUuid.length > 0) {
      filters['uuid'] = { $in: projectsUuid }
    }

    const projects = await Project.find(filters)

    const datasets = projects.map(item => { return item.mainDataset })
    const currentRule = await Rule.findOne({
      organization: ctx.state.organization,
      isDeleted: false,
      isCurrent: true
    }).populate('catalogs')

    let matchCatalogs = currentRule.catalogs.map(item => { return item.slug })

    let currentRole
    let currentOrganization
    if (ctx.state.organization) {
      currentOrganization = user.organizations.find(orgRel => {
        return ctx.state.organization._id.equals(orgRel.organization._id)
      })

      if (currentOrganization) {
        const role = await Role.findOne({_id: currentOrganization.role})

        currentRole = role.toPublic()
      }
    }

    let matchCond = {
      '$match': {
        'dataset': {
          '$in': datasets
        },
        'isDeleted': false
      }
    }

    if (
        currentRole.slug === 'manager-level-1' ||
        currentRole.slug === 'manager-level-2' ||
        currentRole.slug === 'manager-level-3' ||
        currentRole.slug === 'consultor-level-2' ||
        currentRole.slug === 'consultor-level-3'
    ) {
      let userGroups = []
      for (let g of user.groups) {
        userGroups.push(ObjectId(g))
      }

      const catalogItems = await CatalogItem.filterByUserRole(
          {
            isDeleted: false
          },
          currentRole.slug,
          user
        )

      matchCond['$match']['catalogItems'] = { $in: groups.catalogItems }
    }

    let statement = [
      matchCond,
      {
        '$unwind': {
          'path': '$catalogItems'
        }
      },
      {
        '$group': {
          '_id': null,
          'product': {
            '$addToSet': '$newProduct'
          },
          'catalogItem': {
            '$addToSet': '$catalogItems'
          }
        }
      },
      {
        '$lookup': {
          'from': 'catalogitems',
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

    let datasetRow = await DataSetRow.aggregate(statement)

    if (datasetRow.length === 0) {
      ctx.body = {
        catalogItems: []
      }

      return
    }

    const catalogs = datasetRow[0].catalogItems.filter(item => {
      return groups.catalogItems.indexOf(item._id) >= 0 && item.isDeleted === false
    })

    ctx.body = {
      products: datasetRow[0].products,
      catalogItems: catalogs
    }
  }
})
