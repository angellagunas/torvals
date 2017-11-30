// node tasks/verify-datasets.js
require('../../config')
require('lib/databases/mongo')

const Api = require('lib/abraxas/api')
const Task = require('lib/task')
const { Forecast, Prediction } = require('models')
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
    console.log(`Verifying if ${forecast.externalId} forecast has finished processing ...`)

    const prediction = await Prediction.findOne({forecast: forecast._id})
    console.log(prediction)

    var options = {
      url: `${apiData.hostname}${apiData.baseUrl}/forecasts/${prediction.externalId}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiData.token}`
      },
      json: true
    }

    console.log(options)
    var res = await request(options)
    console.log(res)

    // if (res.status !== 'working') {
    //   console.log(`${forecast.externalId} forecast has finished processing`)
    //   forecast.set({
    //     status: 'done'
    //   })

    //   await forecast.save()
    // }
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
