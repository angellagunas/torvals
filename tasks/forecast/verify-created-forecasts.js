// node tasks/verify-datasets.js
require('../../config')
require('lib/databases/mongo')

const Api = require('lib/abraxas/api')
const Task = require('lib/task')
const { Forecast } = require('models')

const task = new Task(async function (argv) {
  console.log('Fetching created Forecasts...')

  const forecasts = await Forecast.find({
    status: 'created',
    isDeleted: false
  })

  if (forecasts.length === 0) {
    console.log('No created forecasts to verify ...')

    return true
  }

  console.log('Obtaining Abraxas API token ...')

  for (var forecast of forecasts) {
    console.log(`Sending ${forecast.configPrId} forecast for processing ...`)
    try {
      var res = await Api.runForecast(forecast.configPrId)
    } catch (e) {
      console.log('error' + e.message)
      return false
    }

    if (res.status === 'OK') {
      forecast.set({
        status: 'processing',
        forecastId: res.forecast_id
      })

      await forecast.save()
    }
  }

  console.log(`Successfully verified ${forecasts.length} forecasts with status {created}`)
  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
