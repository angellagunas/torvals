const Route = require('lib/router/route')

const {DataSet} = require('models')

module.exports = new Route({
  method: 'get',
  path: '/:uuid',
  handler: async function (ctx) {
    var datasetId = ctx.params.uuid

    const dataset = await DataSet.findOne({'uuid': datasetId, 'isDeleted': false})
      .populate('fileChunk')
      .populate('project')
      .populate('organization')
      .populate('newProducts')
      .populate('newSalesCenters')

    ctx.assert(dataset, 404, 'DataSet not found')

    ctx.body = {
      data: dataset.toPublic()
    }
  }
})
