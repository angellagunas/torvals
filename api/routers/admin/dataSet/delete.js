const Route = require('lib/router/route')

const {DataSet} = require('models')

module.exports = new Route({
  method: 'delete',
  path: '/:uuid',
  handler: async function (ctx) {
    var dataSetId = ctx.params.uuid

    var dataset = await DataSet.findOne({'uuid': dataSetId})
    ctx.assert(dataset, 404, 'DataSet not found')

    dataset.set({isDeleted: true})
    dataset.save()

    ctx.body = {
      data: dataset
    }
  }
})
