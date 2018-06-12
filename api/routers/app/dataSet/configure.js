const Route = require('lib/router/route')
const lov = require('lov')
const { DataSet } = require('models')
const reconfigureDataset = require('queues/reconfigure-dataset')
const saveDataset = require('queues/save-dataset')

module.exports = new Route({
  method: 'post',
  path: '/:uuid/configure',
  validator: lov.object().keys({
    isDate: lov.string().required(),
    isAnalysis: lov.string().required(),
    isProduct: lov.string().required(),
    isSalesCenter: lov.string().required(),
    isChannel: lov.string().required()
  }),
  handler: async function (ctx) {
    const body = ctx.request.body
    var datasetId = ctx.params.uuid

    const dataset = await DataSet.findOne({'uuid': datasetId, 'isDeleted': false})
      .populate('project')

    ctx.assert(dataset, 404, 'DataSet no encontrado')

    var groupings = []

    for (var group of body.groupings) {
      groupings.push({
        column: group.column,
        input: group.inputValue,
        output: group.outputValue
      })
    }

    dataset.set({
      columns: body.columns,
      groupings: body.groupings,
      status: 'processing'
    })
    await dataset.save()

    if (dataset.project.status === 'updating-rules') {
      reconfigureDataset.add({uuid: dataset.uuid})
    } else {
      saveDataset.add({uuid: dataset.uuid})
    }

    ctx.body = {
      data: dataset
    }
  }
})
