const Route = require('lib/router/route')
const lov = require('lov')
const verifyDatasetrows = require('queues/update-datasetrows')

const {DataSetRow} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/',
  validator: lov.array().items([
    lov.object().keys({
      uuid: lov.string().required(),
      adjustmentForDisplay: lov.string().required()
    }).required()
  ]),
  handler: async function (ctx) {
    var data = ctx.request.body

    for (let row of data) {
      let datasetRow = await DataSetRow.findOne({
        'uuid': row.uuid,
        'isDeleted': false,
        'organization': ctx.state.organization._id
      })

      ctx.assert(datasetRow, 404, 'DataSetRow no encontrado')

      if (parseFloat(datasetRow.data.adjustmentForDisplay) !== parseFloat(row.localAdjustment)) {
        datasetRow.data.localAdjustment = row.adjustmentForDisplay
        datasetRow.data.updatedBy = ctx.state.user
        datasetRow.status = 'sendingChanges'
        datasetRow.markModified('data')
        await datasetRow.save()
        verifyDatasetrows.add({uuid: row.uuid})
      }
    }

    ctx.body = {
      data: 'OK'
    }
  }
})
