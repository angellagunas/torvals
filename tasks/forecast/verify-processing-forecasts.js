// node tasks/verify-datasets.js
require('../../config')
require('lib/databases/mongo')

const Api = require('lib/abraxas/api')
const Task = require('lib/task')
const { Forecast, Prediction, SalesCenter, Product } = require('models')
const request = require('lib/request')

const task = new Task(async function (argv) {
  console.log('Fetching processing Forecasts...')

  const forecasts = await Forecast.find({status: 'processing'})

  if (forecasts.length === 0) {
    console.log('No processing forecasts to verify ...')

    return true
  }

  console.log('Obtaining Abraxas API token ...')
  await Api.fetch()
  const apiData = Api.get()

  if (!apiData.token) {
    throw new Error('There is no API endpoint configured!')
  }

  for (var forecast of forecasts) {
    console.log(`Verifying if ${forecast.configPrId} forecast has finished processing ...`)

    var options = {
      url: `${apiData.hostname}${apiData.baseUrl}/forecasts/${forecast.forecastId}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiData.token}`
      },
      json: true
    }

    var res = await request(options)

    if (res.status === 'ready') {
      console.log(`${forecast.configPrId} forecast has finished processing`)
      forecast.set({
        status: 'done',
        graphData: res.data
      })

      await forecast.save()

      options = {
        url: `${apiData.hostname}${apiData.baseUrl}/conciliation/forecasts/${forecast.forecastId}`,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${apiData.token}`
        },
        json: true
      }

      console.log(`Obtaining predictions ...`)

      res = await request(options)

      for (var d of res._items) {
        var salesCenter = await SalesCenter.findOne({externalId: d.agency_id})
        var product = await Product.findOne({externalId: d.product_id})

        if (!product) {
          product = await Product.create({
            name: 'Not identified',
            externalId: d.product_id,
            organization: forecast.organization
          })

          forecast.newProducts.push(product)
        } else {
          var pos = forecast.products.findIndex(item => {
            return String(item._id) === String(product._id)
          })

          var posNew = forecast.newProducts.findIndex(item => {
            return String(item._id) === String(product._id)
          })

          if (pos < 0 && posNew < 0) forecast.products.push(product)
        }

        if (!salesCenter) {
          salesCenter = await SalesCenter.create({
            name: 'Not identified',
            externalId: d.agency_id,
            organization: forecast.organization
          })

          forecast.newSalesCenters.push(salesCenter)
        } else {
          pos = forecast.salesCenters.findIndex(item => {
            return String(item._id) === String(salesCenter._id)
          })

          posNew = forecast.newSalesCenters.findIndex(item => {
            return String(item._id) === String(salesCenter._id)
          })

          if (pos < 0 && posNew < 0) forecast.salesCenters.push(salesCenter)
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
            adjustment: d.prediction
          },
          apiData: d,
          salesCenter: salesCenter,
          product: product
        })
      }

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
