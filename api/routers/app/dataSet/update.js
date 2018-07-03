const Route = require('lib/router/route')
const lov = require('lov')

const {DataSet} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/:uuid',
  validator: lov.object().keys({
    name: lov.string().required(),
    description: lov.string()
  }),
  handler: async function (ctx) {
    const body = ctx.request.body
    var datasetId = ctx.params.uuid

    const dataset = await DataSet.findOne({'uuid': datasetId, 'isDeleted': false})
      .populate('fileChunk')
      .populate('organization')

    ctx.assert(dataset, 404, 'DataSet no encontrado')

    dataset.set({
      name: body.name,
      description: body.description,
      status: body.status
    })
    await dataset.save()

    ctx.body = {
      data: dataset
    }
  }
})
