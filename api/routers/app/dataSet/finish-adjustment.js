const Route = require('lib/router/route')
const {DataSet, UserReport, Cycle} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/finish/:uuid',
  handler: async function (ctx) {
    let datasetId = ctx.params.uuid
    const dataset = await DataSet.findOne({'uuid': datasetId, 'isDeleted': false})
      .populate('organization')

    ctx.assert(dataset, 404, 'DataSet no encontrado')

    const project = await Project.findOne({ _id: dataset.project })
    const userReport = await UserReport.findOne({
      user: ctx.state.user,
      dataset: dataset._id
    })
    if (!userReport) {
      const cycle = await Cycle.getCurrent(
        ctx.state.organization._id,
        dataset.rule,
        project.cycleType,
        project.cycleTypeValue
      )
      await UserReport.create({
        user: ctx.state.user,
        dataset: dataset._id,
        cycle: cycle._id,
        project: dataset.project,
        status: 'finished'
      })
    } else {
      userReport.set({
        status: 'finished'
      })
      await userReport.save()
    }

    ctx.body = {
      data: 'OK'
    }
  }
})
