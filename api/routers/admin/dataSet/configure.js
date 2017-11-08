const Route = require('lib/router/route')
const lov = require('lov')

const { DataSet } = require('models')

module.exports = new Route({
  method: 'post',
  path: '/:uuid/configure',
  validator: lov.object().keys({
    isDate: lov.string().required(),
    analyze: lov.string().required()
  }),
  handler: async function (ctx) {
    const body = ctx.request.body
    var datasetId = ctx.params.uuid

    const dataset = await DataSet.findOne({'uuid': datasetId, 'isDeleted': false})

    ctx.assert(dataset, 404, 'DataSet not found')

    var pos = dataset.columns.findIndex(e => {
      return (
        String(e.name) === String(body.isDate)
      )
    })

    dataset.columns[pos].isDate = true

    var pos2 = dataset.columns.findIndex(e => {
      return (
        String(e.name) === String(body.analyze)
      )
    })

    dataset.columns[pos2].analyze = true

    dataset.set({
      status: 'processing'
    })
    await dataset.save()

    setTimeout(() => {
      dataset.set({
        status: 'reviewing'
      })
      dataset.save()
    }, 60000)

    ctx.body = {
      data: dataset
    }
  }
})
