const Route = require('lib/router/route')
const lov = require('lov')

const { DataSet } = require('models')
const Api = require('lib/abraxas/api')
const request = require('lib/request')

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

    for (var col of body.columns) {
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

    try {
      var apiData = Api.get()
      if (!apiData.token) {
        await Api.fetch()
        apiData = Api.get()
      }
    } catch (e) {
      ctx.throw(503, 'Abraxas API no disponible para la conexión')
    }

    var options = {
      url: `${apiData.hostname}${apiData.baseUrl}/process/datasets/${dataset.externalId}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiData.token}`
      },
      body: {
        is_date: isDate,
        is_analysis: isAnalysis,
        is_adjustment: isAdjustment,
        is_prediction: isPrediction,
        filter_analysis: filterAnalysis,
        filter_operations: filterOperations
      },
      json: true,
      persist: true
    }

    try {
      await request(options)
      dataset.set({
        columns: body.columns,
        groupings: body.groupings,
        status: 'processing'
      })
      await dataset.save()
    } catch (e) {
      let errorString = /<title>(.*?)<\/title>/g.exec(e.message)
      if (!errorString) {
        errorString = []
        errorString[1] = e.message
      }
      ctx.throw(503, 'Abraxas API: ' + errorString[1])

      return false
    }

    ctx.body = {
      data: dataset
    }
  }
})
