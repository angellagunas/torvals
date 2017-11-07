// node tasks/send-user-invite.js --email admin@app.comx
require('../../config')
require('lib/databases/mongo')

const Task = require('lib/task')
const { DataSet } = require('models')

const task = new Task(async function (argv) {
  console.log('Fetching non uploaded Datasets...')

  // const files = await FileChunk.find({uploaded: false})

  const datasets = await DataSet.find({uploaded: false})
    .populate('fileChunk')

  if (datasets.length === 0) {
    console.log('No Datasets to upload. All done!')

    return true
  }

  console.log('Uploading Datasets to AWS ...')
  for (var dataset of datasets) {
    await dataset.recreateAndUploadFile()
  }

  console.log('Successfully uploaded ' + datasets.length + ' datasets')
  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
