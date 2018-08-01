const Route = require('lib/router/route')
const {Project, DataSet} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/:uuid/remove/dataset',
  handler: async function (ctx) {
    const projectId = ctx.params.uuid
    const datasetId = ctx.request.body.dataset

    const project = await Project.findOne({'uuid': projectId})
    .populate('datasets.dataset').populate('activeDataset')

    ctx.assert(project, 404, 'Proyecto no encontrado')

    const dataset = await DataSet.findOne({'uuid': datasetId})
    ctx.assert(dataset, 404, 'Dataset no encontrado')

    var auxDatasets = project.datasets.map(item => { return item.dataset.uuid })

    var pos = auxDatasets.indexOf(dataset.uuid)
    project.datasets.splice(pos, 1)

    project.status = 'empty'

    for (var d of project.datasets) {
      if (d.dataset.status === 'conciliated' || d.dataset.status === 'ready') {
        project.status = 'ready'
      }
    }

    if (project.activeDataset && dataset.uuid !== project.activeDataset.uuid) {
      project.status = 'adjustment'
    }

    await project.save()

    dataset.isDeleted = true
    await dataset.save()

    ctx.body = {
      data: project.toAdmin()
    }
  }
})