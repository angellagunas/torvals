const ObjectId = require('mongodb').ObjectID
const Route = require('lib/router/route')
const { DataSet, Organization, Project } = require('models')

module.exports = new Route({
  method: 'get',
  path: '/',
  handler: async function (ctx) {
    var filters = {}
    for (var filter in ctx.request.query) {
      if (filter === 'limit' || filter === 'start' || filter === 'sort') {
        continue
      }

      if (filter === 'organization') {
        const org = await Organization.findOne({'uuid': ctx.request.query[filter]})

        if (org) {
          filters['organization'] = ObjectId(org._id)
        }

        continue
      }

      if (filter === 'project') {
        const project = await Project.findOne({'uuid': ctx.request.query[filter]})

        if (project) {
          filters['_id'] = { $in: project.datasets.map(item => { return item.dataset }) }
        }

        continue
      }

      if (filter === 'project__nin') {
        const project = await Project.findOne({'uuid': ctx.request.query[filter]})

        if (project) {
          filters['_id'] = { $nin: project.datasets.map(item => { return item.dataset }) }
        }

        continue
      }

      if (!isNaN(parseInt(ctx.request.query[filter]))) {
        filters[filter] = parseInt(ctx.request.query[filter])
      } else {
        filters[filter] = ctx.request.query[filter]
      }
    }

    var datasets = await DataSet.dataTables({
      limit: ctx.request.query.limit || 20,
      skip: ctx.request.query.start,
      find: {...filters, isDeleted: false, organization: ctx.state.organization._id},
      sort: ctx.request.query.sort || '-dateCreated'
    })

    ctx.body = datasets
  }
})
