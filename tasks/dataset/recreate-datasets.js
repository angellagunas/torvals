// node tasks/recreate-dataset.js --deleteChunks
require('../../config')
require('lib/databases/mongo')

const Task = require('lib/task')
const { DataSet, FileChunk } = require('models')

const task = new Task(async function (argv) {
  console.log('Fetching non recreated Datasets...')

  const files = await FileChunk.find({recreated: false})

  const datasets = await DataSet.find({fileChunk: {$in: files.map(i => { return i._id })}})
    .populate('fileChunk')

  if (datasets.length === 0) {
    console.log('No Datasets to recreate. All done!')

    return true
  }

  console.log('Recreating Datasets and saving to disk ...')
  for (var dataset of datasets) {
    await dataset.recreateAndSaveFileToDisk()
  }

  if (argv.deleteChunks) {
    console.log('Deleting chunks ...')
    for (dataset of datasets) {
      await dataset.fileChunk.deleteChunks()
    }
  }

  console.log('Successfully recreated ' + datasets.length + ' datasets')
  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
