// node tasks/verify-datasets.js
require('../../config')
require('lib/databases/mongo')

const Api = require('lib/abraxas/api')
const Task = require('lib/task')
const { Forecast } = require('models')
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
