// node tasks/verify-datasets.js
require('../../config')
require('lib/databases/mongo')
const moment = require('moment')

const Api = require('lib/abraxas/api')
const Task = require('lib/task')
const { Forecast, Prediction, SalesCenter, Product } = require('models')

const task = new Task(async function (argv) {
  console.log('Fetching processing Forecasts...')

  const forecasts = await Forecast.find({
    status: 'processing',
    isDeleted: false
  })

  if (forecasts.length === 0) {
    console.log('No processing forecasts to verify ...')

    return true
  }

  for (var forecast of forecasts) {
    console.log(`Verifying if ${forecast.configPrId} forecast has finished processing ...`)

    var res = await Api.getForecast(forecast.forecastId)

    if (res.status === 'error') {
      console.log(`${forecast.configPrId} forecast had an error!`)

      forecast.set({error: res.message, status: 'error'})
      await forecast.save()

      continue
    }

    if (res.status === 'ready') {
      console.log(`${forecast.configPrId} forecast has finished processing`)

      res.data.sort((a, b) => {
        var dateA = moment(a.ds)
        var dateB = moment(b.ds)

        return dateA - dateB
      })

      forecast.set({
        status: 'analistReview',
        graphData: res.data,
        aggregated: res.aggregated
      })

      await forecast.save()

      console.log(`Obtaining predictions ...`)

      res = await Api.conciliateForecast(forecast.forecastId)

      var products = []
      var newProducts = []
      var salesCenters = []
      var newSalesCenters = []

      for (var d of res._items) {
        var salesCenter = await SalesCenter.findOne({
          externalId: d.agency_id,
          organization: forecast.organization
        })
        var product = await Product.findOne({
          externalId: d.product_id,
          organization: forecast.organization
        })

        if (!product) {
          product = await Product.create({
            name: 'Not identified',
            externalId: d.product_id,
            organization: forecast.organization
          })

          newProducts.push(product)
        } else {
          var pos = products.findIndex(item => {
            return String(item._id) === String(product._id)
          })

          var posNew = newProducts.findIndex(item => {
            return String(item._id) === String(product._id)
          })

          if (pos < 0 && posNew < 0) products.push(product)
        }

        if (!salesCenter) {
          salesCenter = await SalesCenter.create({
            name: 'Not identified',
            externalId: d.agency_id,
            organization: forecast.organization
          })

          newSalesCenters.push(salesCenter)
        } else {
          pos = salesCenters.findIndex(item => {
            return String(item._id) === String(salesCenter._id)
          })

          posNew = newSalesCenters.findIndex(item => {
            return String(item._id) === String(salesCenter._id)
          })

          if (pos < 0 && posNew < 0) salesCenters.push(salesCenter)
        }

        await Prediction.create({
          organization: forecast.organization,
          project: forecast.project,
          forecast: forecast,
          externalId: forecast.forecastId,
          data: {
            ...d,
            semanaBimbo: d.semana_bimbo,
            forecastDate: d.forecast_date,
            adjustment: d.prediction,
            channelId: d.channel_id,
            channelName: d.channel_name
          },
          apiData: d,
          salesCenter: salesCenter,
          product: product
        })
      }

      forecast.set({
        products,
        newProducts,
        salesCenters,
        newSalesCenters
      })

      await forecast.save()
    }
  }

  console.log(`Successfully verified ${forecasts.length} forecasts with status {processing}`)
  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
