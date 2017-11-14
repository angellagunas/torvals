// node tasks/send-for-preprocessing.js
require('../../config')
require('lib/databases/mongo')

const Api = require('lib/abraxas/api')
const Task = require('lib/task')
const { DataSet } = require('models')
const request = require('request-promise-native')

const task = new Task(async function (argv) {
  if (!argv.uuid) {
    throw new Error('You need to provide an uuid!')
  }

  console.log('Fetching specified Dataset...')

  const dataset = await DataSet.findOne({uuid: argv.uuid})
    .populate('fileChunk')
    .populate('organization')

  if (!dataset) {
    throw new Error('Invalid uuid!')
  }

  console.log('Obtaining Abraxas API token ...')
  await Api.fetch()
  const apiData = Api.get()

  if (!apiData.token) {
    throw new Error('There is no API endpoint configured!')
  }

  console.log(`Sending ${dataset.name} dataset for preprocessing ...`)
  var options = {
    url: `${apiData.hostname}${apiData.baseUrl}/upload/file/organization`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${apiData.token}`
    },
    body: {
      organization: dataset.organization.uuid,
      path: dataset.url
    },
    json: true
  }

  console.log(options)

  var res = await request(options)
  console.log(res)
  dataset.set({
    externalId: res._id,
    status: 'preprocessing'
  })
  await dataset.save()

  console.log(`Successfully sent for preprocessing dataset ${dataset.name}`)
  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
