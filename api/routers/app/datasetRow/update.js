const Route = require('lib/router/route')
const lov = require('lov')

const {DataSetRow, AdjustmentRequest, Role, UserReport, Cycle, DataSet} = require('models')

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
      if (parseFloat(auxData.adjustmentForDisplay) !== parseFloat(auxData.adjustment)) {
        row.data.adjustment = auxData.adjustmentForDisplay
        row.updatedBy = ctx.state.user
        row.status = 'adjusted'
        row.markModified('data')
        await row.save()

        if (currentRole.slug === 'manager-level-1' || currentRole.slug === 'manager-level-2') {
          await AdjustmentRequest.findOneAndRemove({'datasetRow': row._id})
        }

        if (row.dataset) {
          let userReport = await UserReport.findOne({
            user: ctx.state.user,
            dataset: row.dataset
          })
          if (!userReport) {
            let dataset = await DataSet.findOne({_id: row.dataset})

            await UserReport.create({
              user: ctx.state.user,
              dataset: row.dataset,
              project: dataset.project,
              cycle: row.cycle
            })
          } else {
            userReport.set({
              status: 'in-progress'
            })
            await userReport.save()
          }
        }

        uuidsAux.push({uuid: row.uuid})
      }
    }

    ctx.body = {
      data: 'OK'
    }
  }
})
