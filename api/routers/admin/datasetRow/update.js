const Route = require('lib/router/route')
const lov = require('lov')

const {DataSetRow} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/:uuid',
  validator: lov.object().keys({
    localAdjustment: lov.number()
  }),
  handler: async function (ctx) {
    var datasetRowId = ctx.params.uuid
    var data = ctx.request.body

    const datasetRow = await DataSetRow.findOne({'uuid': datasetRowId, 'isDeleted': false})
    ctx.assert(datasetRow, 404, 'DataSetRow no encontrado')

    if (parseFloat(datasetRow.data.localAdjustment) !== parseFloat(data.localAdjustment)) {
      datasetRow.data.localAdjustment = data.localAdjustment
      datasetRow.data.updatedBy = ctx.state.user
      datasetRow.status = 'sendingChanges'
      datasetRow.markModified('data')
      await datasetRow.save()
    }
    ctx.body = {
      data: datasetRow.toAdmin()
    }
  }
})
