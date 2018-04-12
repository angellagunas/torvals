const Route = require('lib/router/route')
const lov = require('lov')

const {Project, Organization, DataSetRow, Product, AdjustmentRequest, SalesCenter, Channel} = require('models')

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
      for (var datasetrow of datasetrows) {
        datasetrow.organization = data.organization._id

        let product = await Product.findOne({'_id': datasetrow.product})
        let productNewOrg = await Product.findOne({'externalId': product.externalId, 'organization': data.organization._id})
        if (productNewOrg) {
          datasetrow.product = productNewOrg._id
        } else {
          product.organization = data.organization._id
          let newProduct = await Product.create({
            name: product.name,
            organization: data.organization._id,
            price: product.price || null,
            description: product.description || null,
            type: product.type || null,
            category: product.category || null,
            subcategory: product.subcategory || null,
            externalId: product.externalId
          })
          datasetrow.product = newProduct._id
        }

        let salesCenter = await SalesCenter.findOne({'_id': datasetrow.salesCenter})
        let SalesCenterNewOrg = await SalesCenter.findOne({'externalId': salesCenter.externalId, 'organization': data.organization._id})
        if (SalesCenterNewOrg) {
          datasetrow.salesCenter = SalesCenterNewOrg._id
        } else {
          salesCenter.organization = data.organization._id
          let newSalesCenter = await SalesCenter.create({
            name: salesCenter.name,
            organization: data.organization._id,
            description: salesCenter.description || null,
            address: salesCenter.address || null,
            brand: salesCenter.brand || null,
            region: salesCenter.region || null,
            type: salesCenter.type || null,
            externalId: salesCenter.externalId
          })
          datasetrow.salesCenter = newSalesCenter._id
        }

        let channel = await Channel.findOne({'_id': datasetrow.channel})
        let channelNewOrg = await Channel.findOne({'externalId': channel.externalId, 'organization': data.organization._id})
        if (channelNewOrg) {
          datasetrow.channel = channelNewOrg._id
        } else {
          channel.organization = data.channel._id
          let newChannel = await Channel.create({
            name: channel.name,
            externalId: channel.externalId,
            organization: data.organization._id
          })
          datasetrow.channel = newChannel._id
        }

        await datasetrow.save()
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
