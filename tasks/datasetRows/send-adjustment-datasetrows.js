// node tasks/datasetsRows/send-adjustment-datasetrows.js
require('../../config')
require('lib/databases/mongo')

const Api = require('lib/abraxas/api')
const Task = require('lib/task')
const { DataSetRow } = require('models')
const request = require('lib/request')

const task = new Task(async function (argv) {
  console.log('Fetching DatasetsRows...')
  var apiData

  const datasetRow = await DataSetRow.findOne({
    uuid: argv.uuid
  }).populate('dataset')

  if (datasetRow.length === 0) {
    console.log('No datasetRows to verify ...')
    return true
  }

  console.log('Obtaining Abraxas API token ...')
  try {
    await Api.fetch()
    apiData = Api.get()
  } catch (e) {
    datasetRow.set({status: 'error'})
    await datasetRow.save()

    return false
  }

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
      adjustment: datasetRow.data.localAdjustment
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

    return false
  }

  await dataset.save()
  await datasetRow.save()

  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
