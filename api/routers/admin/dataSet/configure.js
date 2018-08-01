const Route = require('lib/router/route')
const lov = require('lov')
const config = require('config')
const abraxas = config.abraxas
const { DataSet, FileChunk } = require('models')
const Api = require('lib/abraxas/api')

module.exports = new Route({
  method: 'post',
  path: '/:uuid/configure',
  validator: lov.object().keys({
    isDate: lov.string().required(),
    isAnalysis: lov.string().required(),
    isProduct: lov.string().required(),
    isSalesCenter: lov.string().required(),
    isChannel: lov.string().required()
  }),
  handler: async function (ctx) {
    const body = ctx.request.body
    var datasetId = ctx.params.uuid
    const dataset = await DataSet.findOne({'uuid': datasetId, 'isDeleted': false})
      .populate('fileChunk')
      .populate('project')
      .populate('organization')
      .populate('newProducts')
      .populate('newSalesCenters')
      .populate('newChannels')
    ctx.assert(dataset, 404, 'DataSet no encontrado')

    var isDate = body.columns.find((item) => {
      return item.isDate
    }).name
    var isAnalysis = body.columns.find((item) => {
      return item.isAnalysis
    }).name

    var isProduct = body.columns.find((item) => {
      return item.isProduct
    }).name

    var checkProductName = body.columns.find((item) => {
      return item.isProductName
    })

    var isProductName = checkProductName ? checkProductName.name : undefined

    var isSalesCenter = body.columns.find((item) => {
      return item.isSalesCenter
    }).name

    var checkSalesCenterName = body.columns.find((item) => {
      return item.isSalesCenterName
    })

    var isSalesCenterName = checkSalesCenterName ? checkSalesCenterName.name : undefined

    var isChannel = body.columns.find((item) => {
      return item.isChannel
    }).name

    var checkChannelName = body.columns.find((item) => {
      return item.isChannelName
    })

    var isChannelName = checkChannelName ? checkChannelName.name : undefined

    var checkIsAdjustment = body.columns.find((item) => {
      return item.isAdjustment
    })

    var isAdjustment = checkIsAdjustment ? checkIsAdjustment.name : undefined

    var checkIsPrediction = body.columns.find((item) => {
      return item.isPrediction
    })

    var isPrediction = checkIsPrediction ? checkIsPrediction.name : undefined

    var filterAnalysis = []
    var filterOperations = []
    var groupings = []
    var headers = []

    for (var col of body.columns) {
      headers.push(col.name)
      if (col.isAnalysisFilter) filterAnalysis.push(col.name)
      if (col.isOperationFilter) filterOperations.push(col.name)
    }

    filterAnalysis.push({product: {
      _id: isProduct,
      name: isProductName
    }})

    filterAnalysis.push({agency: {
      _id: isSalesCenter,
      name: isSalesCenterName
    }})

    filterAnalysis.push({channel: {
      _id: isChannel,
      name: isChannelName
    }})

    for (var group of body.groupings) {
      groupings.push({
        column: group.column,
        input: group.inputValue,
        output: group.outputValue
      })
    }

    var url
    if (abraxas.abraxasS3 === 'true') {
      url = dataset.url
    } else {
      const fileChunk = await FileChunk.findOne({_id: dataset.fileChunk})
      url = fileChunk.path
    }

    dataset.set({
      columns: body.columns,
      groupings: body.groupings,
      status: 'processing'
    })
    await dataset.save()

    var res = await Api.uploadDataset({
      project_id: dataset.project.externalId,
      path: url,
      headers: headers,
      config: {
        is_date: isDate,
        is_analysis: isAnalysis,
        is_adjustment: isAdjustment,
        is_prediction: isPrediction,
        filter_analysis: filterAnalysis,
        filter_operations: filterOperations
      }
    })

    if (res._id) {
      dataset.set({
        externalId: res._id,
        status: 'processing'
      })
    } else {
      dataset.set({
        externalId: 'externalId not received',
        status: 'error'
      })
    }
    await dataset.save()

    ctx.body = {
      data: dataset
    }
  }
})