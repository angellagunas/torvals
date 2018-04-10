const Route = require('lib/router/route')
const lov = require('lov')

const {Project, Organization, DataSetRow, Product, AdjustmentRequest} = require('models')

module.exports = new Route({
  method: 'post',
  path: '/:uuid',
  validator: lov.object().keys({
    name: lov.string().required(),
    organization: lov.string().required()
  }),
  handler: async function (ctx) {
    var projectId = ctx.params.uuid
    var data = ctx.request.body

    const project = await Project.findOne({'uuid': projectId, 'isDeleted': false}).populate('organization').populate('datasets.dataset')
    ctx.assert(project, 404, 'Proyecto no encontrado')

    const org = await Organization.findOne({uuid: data.organization})
    ctx.assert(org, 404, 'Organización no encontrada')

    data.organization = org

    if (!data.organization._id.equals(project.organization._id)) {
      for (var ds of project.datasets) {
        let dataset = ds.dataset
        dataset.organization = data.organization._id
        await dataset.save()
        await dataset.processData()
      }
      var datasetrows = await DataSetRow.find({'project': project._id})
      for (var dsr of datasetrows) {
        dsr.organization = data.organization._id
        await dsr.save()
        let product = await Product.findOne({'_id': dsr.product})
        if (product) {
          product.organization = data.organization._id
          await product.save()
        }
      }
      var adjustmentrequest = await AdjustmentRequest.find({'project': project._id})
      for (var ar of adjustmentrequest) {
        ar.organization = data.organization._id
        await ar.save()
      }
    }
    project.set({
      name: data.name,
      description: data.description,
      organization: data.organization,
      status: data.status
    })

    project.save()

    ctx.body = {
      data: project
    }
  }
})
