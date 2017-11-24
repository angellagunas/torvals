const Route = require('lib/router/route')
const {Project, DataSet} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/:uuid/add/dataset',
  handler: async function (ctx) {
    const projectId = ctx.params.uuid
    const datasetId = ctx.request.body.dataset
    const columns = ctx.request.body.columns

    const project = await Project.findOne({'uuid': projectId})
    ctx.assert(project, 404, 'Project not found')

    const dataset = await DataSet.findOne({'uuid': datasetId})
    ctx.assert(dataset, 404, 'Dataset not found')

    project.datasets.push({
      dataset: dataset,
      columns: columns
    })

    project.save()

    ctx.body = {
      data: project.toAdmin()
    }
  }
})
