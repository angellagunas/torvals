const Route = require('lib/router/route')

const {AdjustmentDownload, Project} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/:uuid',
  handler: async function (ctx) {
    var projectUuid = ctx.params.uuid

    const project = await Project.findOne({
      'uuid': projectUuid,
      'isDeleted': false,
      'organization': ctx.state.organization
    })

    ctx.assert(project, 404, 'Project not found')

    var filters = {}
    for (var filter in ctx.request.query) {
      if (filter === 'limit' || filter === 'start' || filter === 'sort') {
        continue
      }

      if (!isNaN(parseInt(ctx.request.query[filter]))) {
        filters[filter] = parseInt(ctx.request.query[filter])
      } else {
        filters[filter] = ctx.request.query[filter]
      }
    }

    var downloads = await AdjustmentDownload.dataTables({
      limit: ctx.request.query.limit || 0,
      skip: ctx.request.query.start,
      find: {...filters, isDeleted: false, project: project._id},
      populate: [
        'project',
        'dataset'
      ],
      sort: ctx.request.query.sort || '-dateCreated'
    })

    downloads.data = downloads.data.map(item => {
      return item.toPublic()
    })

    ctx.body = downloads
  }
})
