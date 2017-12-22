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
    isSalesCenter: lov.string().required()
  }),
  handler: async function (ctx) {
    const body = ctx.request.body
    var datasetId = ctx.params.uuid
    const dataset = await DataSet.findOne({'uuid': datasetId, 'isDeleted': false})
    ctx.assert(dataset, 404, 'DataSet not found')

    var isDate = body.columns.find((item) => {
      return item.isDate
    }).name
    var isAnalysis = body.columns.find((item) => {
      return item.isAnalysis
    }).name

    var isProduct = body.columns.find((item) => {
      return item.isProduct
    }).name

    var isSalesCenter = body.columns.find((item) => {
      return item.isSalesCenter
    }).name

    var filterAnalysis = []
    var filterOperations = []
    var groupings = []

    for (var col of body.columns) {
      if (col.isAnalysisFilter) filterAnalysis.push(col.name)
      if (col.isOperationFilter) filterOperations.push(col.name)
    }

    for (var group of body.groupings) {
      groupings.push({
        column: group.column,
        input: group.inputValue,
        output: group.outputValue
      })
    }

    var apiData = Api.get()
    if (!apiData.token) {
      await Api.fetch()
      apiData = Api.get()
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
        isDate: isDate,
        isAnalysis: isAnalysis,
        isProduct: isProduct,
        isSalesCenter: isSalesCenter,
        filterAnalysis: filterAnalysis,
        filterOperations: filterOperations,
        groupings: groupings
      },
      json: true,
      persist: true
    }

    try {
      var res = await request(options)
      dataset.set({
        columns: body.columns,
        groupings: body.groupings,
        status: 'processing'
      })
      await dataset.save()
    } catch (e) {
      ctx.throw(401, 'Failed to send Dataset for processing')
    }

    ctx.body = {
      data: dataset
    }
  }
})
