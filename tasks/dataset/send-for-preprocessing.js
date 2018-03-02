// node tasks/send-for-preprocessing.js
require('../../config')
require('lib/databases/mongo')

const Api = require('lib/abraxas/api')
const Task = require('lib/task')
const { DataSet } = require('models')
const request = require('lib/request')

const task = new Task(async function (argv) {
  if (!argv.uuid) {
    throw new Error('You need to provide an uuid!')
  }

  console.log('Fetching specified Dataset...')
  var apiData

  const dataset = await DataSet.findOne({uuid: argv.uuid})
    .populate('fileChunk')
    .populate('organization')
    .populate('project')

  if (!dataset) {
    throw new Error('Invalid uuid!')
  }

  console.log('Obtaining Abraxas API token ...')
  try {
    await Api.fetch()
    apiData = Api.get()
  } catch (e) {
    dataset.set({
      error: 'No se pudo enviar el dataset a preprocesar! Intente borrarlo y crear otro dataset.',
      status: 'error'
    })
    await dataset.save()

    return false
  }

  if (!apiData.token) {
    throw new Error('There is no API endpoint configured!')
  }

  console.log(`Sending ${dataset.name} dataset for preprocessing ...`)
  var options = {
    url: `${apiData.hostname}${apiData.baseUrl}/upload/file/datasets`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${apiData.token}`
    },
    body: {
      project_id: dataset.project.externalId,
      path: dataset.url
    },
    json: true,
    persist: true
  }

  try {
    var res = await request(options)

    if (res.status === 'error') {
      dataset.set({
        error: res.message,
        status: 'error'
      })

      await dataset.save()

      console.log(`Error while sending dataset for preprocessing: ${dataset.error}`)
      return false
    }
    if (res._id) {
      dataset.set({
        externalId: res._id,
        status: 'preprocessing'
      })
    } else {
      dataset.set({
        externalId: 'externalId not received',
        status: 'error'
      })
    }
    await dataset.save()

    console.log(`Successfully sent for preprocessing dataset ${dataset.name}`)
    return true
  } catch (e) {
    console.log(`Error while sending dataset for preprocessing: ${e}`)
    return false
  }
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
