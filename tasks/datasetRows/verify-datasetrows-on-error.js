// node tasks/datasetsRows/verify-datasetrows-on-error.js
require('../../config')
require('lib/databases/mongo')

const Api = require('lib/abraxas/api')
const Task = require('lib/task')
const { DataSetRow } = require('models')
const request = require('lib/request')

const task = new Task(async function (argv) {
  console.log('Fetching DatasetsRows...')

  const datasetRows = await DataSetRow.find({
    status: 'error'
  }).populate('dataset')

  if (datasetRows.length === 0) {
    console.log('No datasetRows to verify ...')
    return true
  }

  console.log('Obtaining Abraxas API token ...')
  await Api.fetch()
  const apiData = Api.get()

  for (var datasetRow of datasetRows) {
    var options = {
      url: `${apiData.hostname}${apiData.baseUrl}/datasets/${datasetRow.dataset.externalId}`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiData.token}`,
        'If-Match': `${datasetRow.dataset.etag}`
      },
      body: {
        data_rows_id: datasetRow.externalId,
        adjustment: datasetRow.data.adjustment
      },
      json: true,
      persist: true
    }
    var dataset = datasetRow.dataset
    console.log(`Sending adjustment of DataSetRow ${datasetRow.externalId}`)

    try {
      var res = await request(options)

      if (res._status === 'OK') {
        dataset.etag = res._etag
        datasetRow.set({status: 'adjusted'})
        console.log(`Sent succesfully adjustment of DataSetRow ${datasetRow.externalId}`)
      } else {
        datasetRow.set({status: 'error'})
      }
    } catch (e) {
      datasetRow.set({status: 'error'})
    }

    await dataset.save()
    await datasetRow.save()
  }
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
