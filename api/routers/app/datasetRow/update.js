const Route = require('lib/router/route')
const lov = require('lov')
const verifyDatasetrows = require('queues/update-datasetrows')

const {DataSetRow} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/:uuid',
  validator: lov.object().keys({
    adjustment: lov.number()
  }),
  handler: async function (ctx) {
    var datasetRowId = ctx.params.uuid
    var data = ctx.request.body
    console.log(data)

    const datasetRow = await DataSetRow.findOne({
      'uuid': datasetRowId,
      'isDeleted': false,
      'organization': ctx.state.organization
    })
    ctx.assert(datasetRow, 404, 'DataSetRow no encontrado')

    if (parseFloat(datasetRow.data.adjustmentForDisplay) !== parseFloat(data.localAdjustment)) {
      datasetRow.data.localAdjustment = data.adjustmentForDisplay
      datasetRow.data.updatedBy = ctx.state.user
      datasetRow.status = 'sendingChanges'
      datasetRow.markModified('data')
      await datasetRow.save()
      verifyDatasetrows.add({uuid: datasetRowId})
    }

    ctx.body = {
      data: datasetRow.toPublic()
    }
  }
})
