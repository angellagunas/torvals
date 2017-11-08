const Route = require('lib/router/route')
const lov = require('lov')

const { DataSet, Organization } = require('models')

module.exports = new Route({
  method: 'post',
  path: '/:uuid',
  validator: lov.object().keys({
    name: lov.string().required(),
    description: lov.string(),
    organization: lov.string().required()
  }),
  handler: async function (ctx) {
    const body = ctx.request.body
    const org = await Organization.findOne({uuid: body.organization})

    if (!org) {
      ctx.throw(404, 'Organization not found')
    }

    body.organization = org
    var datasetId = ctx.params.uuid

    const dataset = await DataSet.findOne({'uuid': datasetId, 'isDeleted': false})
      .populate('fileChunk')
      .populate('organization')

    ctx.assert(dataset, 404, 'DataSet not found')

    dataset.set({
      name: body.name,
      description: body.description,
      organization: body.organization
    })
    await dataset.save()

    ctx.body = {
      data: dataset
    }
  }
})
