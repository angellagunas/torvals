const Route = require('lib/router/route')
const moment = require('moment')

const {DataSetRow, AdjustmentRequest, Role, UserReport, Cycle} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/request',
  handler: async function (ctx) {
    var data = ctx.request.body
    var returnData = {}
    var uuidsAux = []
    let dataset
    for (let row of data) {
      if (!row.uuid || !row.newAdjustment) {
        continue
      }

      const datasetRow = await DataSetRow.findOne({'uuid': row.uuid, 'isDeleted': false})
        .populate('adjustmentRequest dataset')
      ctx.assert(datasetRow, 404, 'DataSetRow no encontrado')

      var adjustmentRequest = datasetRow.adjustmentRequest

      const user = ctx.state.user
      var currentRole
      const currentOrganization = user.organizations.find(orgRel => {
        return ctx.state.organization._id.equals(orgRel.organization._id)
      })

      if (currentOrganization) {
        const role = await Role.findOne({_id: currentOrganization.role})

        currentRole = role.toPublic()
      }

      var status = 'created'
      if (currentRole.slug !== 'manager-level-1') {
        status = 'approved'
      }

      if (!adjustmentRequest) {
        adjustmentRequest = await AdjustmentRequest.create({
          organization: datasetRow.organization,
          project: datasetRow.project,
          dataset: datasetRow.dataset,
          datasetRow: datasetRow._id,
          product: datasetRow.product,
          newProduct: datasetRow.newProduct,
          channel: datasetRow.channel,
          salesCenter: datasetRow.salesCenter,
          lastAdjustment: datasetRow.data.adjustment,
          newAdjustment: row.newAdjustment,
          requestedBy: ctx.state.user._id,
          status: status,
          catalogItems: datasetRow.catalogItems
        })

        datasetRow.adjustmentRequest = adjustmentRequest
        await datasetRow.save()
      } else {
        adjustmentRequest.status = status
        adjustmentRequest.lastAdjustment = datasetRow.data.adjustment
        adjustmentRequest.newAdjustment = row.newAdjustment
        adjustmentRequest.requestedBy = ctx.state.user
      }

      if (currentRole.slug !== 'manager-level-1') {
        adjustmentRequest.approvedBy = ctx.state.user._id
        adjustmentRequest.dateApproved = moment.utc()
        datasetRow.data.adjustment = adjustmentRequest.newAdjustment
        datasetRow.status = 'adjusted'
        datasetRow.data.updatedBy = ctx.state.user
        datasetRow.markModified('data')
        await datasetRow.save()
        uuidsAux.push({uuid: datasetRow.uuid})
      }

      await adjustmentRequest.save()
      dataset = datasetRow.dataset

      returnData[row.uuid] = adjustmentRequest.toPublic()
    }

    if (dataset) {
      const userReport = await UserReport.findOne({
        user: ctx.state.user,
        dataset: dataset._id
      })
      if (!userReport) {
        const cycle = await Cycle.getCurrent(ctx.state.organization._id, dataset.rule)
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
    }

    ctx.body = {data: returnData}
  }
})
