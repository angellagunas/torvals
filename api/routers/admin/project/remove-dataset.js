const Route = require('lib/router/route')
const {Project, DataSet} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/:uuid/remove/dataset',
  handler: async function (ctx) {
    const projectId = ctx.params.uuid
    const datasetId = ctx.request.body.dataset

    const project = await Project.findOne({'uuid': projectId}).populate('datasets.dataset')
    ctx.assert(project, 404, 'Project not found')

    const dataset = await DataSet.findOne({'uuid': datasetId})
    ctx.assert(dataset, 404, 'Dataset not found')

    var auxDatasets = project.datasets.map(item => { return item.dataset.uuid })

    var pos = auxDatasets.indexOf(dataset.uuid)
    project.datasets.splice(pos, 1)

    project.status = 'empty'

    for (var d of project.datasets) {
      if (d.dataset.status === 'consolidated') {
        project.status = 'ready'
        break
      }
    }

    project.save()

    dataset.isDeleted = true
    dataset.save()

    ctx.body = {
      data: project.toAdmin()
    }
  }
})
