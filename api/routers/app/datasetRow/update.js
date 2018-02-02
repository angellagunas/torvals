const Route = require('lib/router/route')
const lov = require('lov')

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

    const datasetRow = await DataSetRow.findOne({
      'uuid': datasetRowId,
      'isDeleted': false,
      'organization': ctx.state.organization
    })
    ctx.assert(datasetRow, 404, 'DataSetRow not found')

    datasetRow.data.lastAdjustment = datasetRow.data.adjustment
    datasetRow.data.adjustment = data.adjustment
    datasetRow.data.updatedBy = ctx.state.user
    datasetRow.markModified('data')
    datasetRow.save()

    ctx.body = {
      data: datasetRow.format()
    }
  }
})
