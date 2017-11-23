// node tasks/verify-datasets.js
require('../../config')
require('lib/databases/mongo')

const Api = require('lib/abraxas/api')
const Task = require('lib/task')
const { Forecast } = require('models')
const request = require('lib/request')

const task = new Task(async function (argv) {
  console.log('Fetching created Forecasts...')

  const forecasts = await Forecast.find({status: 'created'})

  if (forecasts.length === 0) {
    console.log('No created forecasts to verify ...')

    return true
  }

  console.log('Obtaining Abraxas API token ...')
  await Api.fetch()
  const apiData = Api.get()

  if (!apiData.token) {
    throw new Error('There is no API endpoint configured!')
  }

  for (var forecast of forecasts) {
    console.log(`Sending ${forecast.externalId} forecast for processing ...`)
    var options = {
      url: `${apiData.hostname}${apiData.baseUrl}/run/forecasts/${forecast.externalId}`,
      method: 'POST',
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

    if (res.status === 'working') {
      forecast.set({
        status: 'processing'
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
