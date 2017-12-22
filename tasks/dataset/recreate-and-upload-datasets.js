// node tasks/recreate-and-upload-dataset.js --deleteChunks
require('../../config')
require('lib/databases/mongo')

const Task = require('lib/task')
const { DataSet, FileChunk } = require('models')

const task = new Task(async function (argv) {
  console.log('Fetching non recreated and uploaded Datasets...')

  const files = await FileChunk.find({recreated: false})

  const datasets = await DataSet.find({
    fileChunk: {$in: files.map(i => { return i._id })},
    uploaded: false
  }).populate('fileChunk')

  if (datasets.length === 0) {
    console.log('No Datasets to recreate and upload. All done!')

    return true
  }

  console.log('Recreating Datasets and uploading to AWS ...')
  for (var dataset of datasets) {
    await dataset.recreateAndUploadFile()
  }

  if (argv.deleteChunks) {
    console.log('Deleting chunks ...')
    for (dataset of datasets) {
      await dataset.fileChunk.deleteChunks()
    }
  }

  console.log('Successfully recreated and uploaded ' + datasets.length + ' datasets')
  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
