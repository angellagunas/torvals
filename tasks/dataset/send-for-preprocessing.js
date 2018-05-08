// node tasks/dataset/send-for-preprocessing.js
require('../../config')
require('lib/databases/mongo')

const Api = require('lib/abraxas/api')
const Task = require('lib/task')
const { DataSet } = require('models')

const task = new Task(async function (argv) {
  if (!argv.uuid) {
    throw new Error('You need to provide an uuid!')
  }

  console.log('Fetching specified Dataset...')

  const dataset = await DataSet.findOne({uuid: argv.uuid})
    .populate('fileChunk')
    .populate('organization')
    .populate('project')

  if (!dataset) {
    throw new Error('Invalid uuid!')
  }

  console.log(`Sending ${dataset.name} dataset for preprocessing ...`)

  try {
    var res = await Api.uploadDataset(dataset)

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
    dataset.set({
      error: e.message,
      status: 'error'
    })
    await dataset.save()

    console.log(`Error sending the dataset: ${e.message}`)
    return false
  }
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
