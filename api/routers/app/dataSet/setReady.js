const Route = require('lib/router/route')
const lov = require('lov')

const { DataSet } = require('models')

module.exports = new Route({
  method: 'post',
  path: '/:uuid/set/ready',
  validator: lov.object().keys({
    isDate: lov.string().required(),
    analyze: lov.string().required()
  }),
  handler: async function (ctx) {
    var datasetId = ctx.params.uuid

    const dataset = await DataSet.findOne({'uuid': datasetId, 'isDeleted': false})

    ctx.assert(dataset, 404, 'DataSet not found')

    dataset.set({
      status: 'ready'
    })
    await dataset.save()

    ctx.body = {
      data: dataset
    }
  }
})
