// node tasks/send-for-preprocessing.js
require('../../config')
require('lib/databases/mongo')

const Api = require('lib/abraxas/api')
const Task = require('lib/task')
const { DataSet } = require('models')
const request = require('request-promise-native')

const task = new Task(async function (argv) {
  console.log('Fetching non preprocessed Datasets...')

  const datasets = await DataSet.find({
    status: 'uploaded',
    uploaded: true
  }).populate('fileChunk').populate('organization')

  if (datasets.length === 0) {
    console.log('No Datasets to preprocess. All done!')

    return true
  }

  console.log('Obtaining Abraxas API token ...')
  await Api.fetch()
  const apiData = Api.get()

  if (!apiData.token) {
    console.log('Error! There is no API endpoint configured!')
    return false
  }

  console.log('Sending Datasets for preprocessing ...')
  for (var dataset of datasets) {
    var options = {
      url: `${apiData.hostname}${apiData.baseUrl}/upload/file/projects`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiData.token}`
      },
      body: {
        // organization: dataset.organization.uuid,
        path: dataset.url
      },
      json: true
    }

    console.log(options)

    var res = await request(options)
    console.log(res)
    dataset.set({
      // externalId: res.uuid || res._id,
      status: 'preprocessing'
    })
    await dataset.save()
  }

  console.log('Successfully sent for preprocessing ' + datasets.length + ' datasets')
  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
