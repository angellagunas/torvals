const Route = require('lib/router/route')
const lov = require('lov')
const verifyDatasetrows = require('queues/update-datasetrows')

const {DataSetRow, AdjustmentRequest} = require('models')

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

    var hashTable = {}
    var uuidsAux = []
    var uuids = data.map(item => {
      hashTable[item.uuid] = {
        adjustmentForDisplay: item.adjustmentForDisplay,
        localAdjustment: item.localAdjustment
      }

      return item.uuid
    })

    let datasetRows = await DataSetRow.find({
      'uuid': { $in: uuids },
      'isDeleted': false,
      'organization': ctx.state.organization._id
    })

    if (datasetRows.length < data.length) {
      ctx.throw(404, 'Algunos DataSetRows no fueron encontrados')
    }

    const user = ctx.state.user
    var currentRole
    const currentOrganization = user.organizations.find(orgRel => {
      return ctx.state.organization._id.equals(orgRel.organization._id)
    })

    if (currentOrganization) {
      const role = await Role.findOne({_id: currentOrganization.role})

      currentRole = role.toPublic()
    }

    for (let row of datasetRows) {
      let auxData = hashTable[row.uuid]
      if (parseFloat(row.data.adjustmentForDisplay) !== parseFloat(auxData.localAdjustment)) {
        row.data.localAdjustment = auxData.adjustmentForDisplay
        row.data.updatedBy = ctx.state.user
        row.status = 'sendingChanges'
        row.markModified('data')
        await row.save()

        if (currentRole.slug === 'manager-level-1' || currentRole.slug === 'manager-level-2') {
          await AdjustmentRequest.findOneAndRemove({'datasetRow': row._id})
        }

        uuidsAux.push({uuid: row.uuid})
      }
    }

    verifyDatasetrows.addList(uuidsAux)

    ctx.body = {
      data: 'OK'
    }
  }
})
