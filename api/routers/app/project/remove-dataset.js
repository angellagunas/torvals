const Route = require('lib/router/route')
const {Project, DataSet} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/:uuid/remove/dataset',
  handler: async function (ctx) {
    const projectId = ctx.params.uuid
    const datasetId = ctx.request.body.dataset

    const project = await Project.findOne({'uuid': projectId})
    ctx.assert(project, 404, 'Project not found')

    const dataset = await DataSet.findOne({'uuid': datasetId})
    ctx.assert(dataset, 404, 'Dataset not found')

    var pos = project.datasets.indexOf(dataset._id)
    project.datasets.splice(pos, 1)

    if (project.datasets.length === 0) {
      project.status = 'empty'
    }

    project.save()

    dataset.isDeleted = true
    dataset.save()

    ctx.body = {
      data: project.toAdmin()
    }
  }
})
