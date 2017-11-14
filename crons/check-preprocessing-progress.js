// node crons/check-preprocessing-progress
require('../config')
require('lib/databases/mongo')

const Cron = require('lib/cron')
const { DataSet } = require('models')
const verifyPreprocessingDatasets = require('tasks/dataset/verify-preprocessing-datasets')
const verifyProcessingDatasets = require('tasks/dataset/verify-processing-datasets')

const cron = new Cron({
  tick: '* * * * *',
  task: async function () {
    // var a, b
    // a = await verifyPreprocessingDatasets.run()
    // b = await verifyProcessingDatasets.run()
    // return a && b
    const datasets = await DataSet.find({status: 'processing'})

    for (const dataset of datasets) {
      dataset.status = 'reviewing'
      await dataset.save()
      console.log(`Dataset ${dataset.uuid} set as reviewing`)
    }
  }
})

if (require.main === module) {
  cron.schedule()
} else {
  module.exports = cron
}
