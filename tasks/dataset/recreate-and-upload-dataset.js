// node tasks/recreate-and-upload-dataset.js --uuid uuid --deleteChunks
require('../../config')
require('lib/databases/mongo')

const Task = require('lib/task')
const { DataSet } = require('models')

const task = new Task(async function (argv) {
  if (!argv.uuid) {
    throw new Error('You need to provide an uuid!')
  }

  console.log('Fetching specified Dataset...')

  const dataset = await DataSet.findOne({uuid: argv.uuid}).populate('fileChunk')

  if (!dataset) {
    throw new Error('Invalid uuid!')
  }

  console.log(`Recreating ${dataset.name} Dataset and uploading to AWS ...`)
  await dataset.recreateAndUploadFile()

  if (argv.deleteChunks) {
    console.log('Deleting chunks ...')
    await dataset.fileChunk.deleteChunks()
  }

  console.log(`Successfully recreated and uploaded dataset ${dataset.name}`)
  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
