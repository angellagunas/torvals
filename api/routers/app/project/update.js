const ObjectId = require('mongodb').ObjectID
const Route = require('lib/router/route')
const moment = require('moment')
const lov = require('lov')

const { Project, DataSet } = require('models')

module.exports = new Route({
  method: 'post',
  path: '/:uuid',
  validator: lov.object().keys({
    name: lov.string().required()
  }),
  handler: async function (ctx) {
    var projectId = ctx.params.uuid
    var data = ctx.request.body

    const project = await Project.findOne({'uuid': projectId, 'isDeleted': false}).populate('organization')
    ctx.assert(project, 404, 'Proyecto no encontrado')

    let mainDataset = null
    let activeDataset = null
    if (data.mainDatasetV) {
      mainDataset = await DataSet.findOne({ uuid: data.mainDatasetV })
    }
    if (data.activeDatasetV) {
      activeDataset = await DataSet.findOne({ uuid: data.activeDatasetV })
    }

    project.set({
      name: data.name,
      description: data.description,
      status: data.status,
      cycleType: data.cycleType || 'add',
      cycleTypeValue: data.cycleTypeValue || 6,
      mainDataset: mainDataset ? ObjectId(mainDataset._id) : null,
      activeDataset: activeDataset ? ObjectId(activeDataset._id) : null,
      timerStart: moment(data.timerStart).utc(),
      timerEnd: moment(data.timerEnd).utc()
    })

    if (data.showOnDashboard !== undefined) {
      project.set({
        showOnDashboard: data.showOnDashboard
      })
    }

    project.save()

    ctx.body = {
      data: project
    }
  }
})
