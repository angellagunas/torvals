// node tasks/dataset/restore-rows-from-historical.js --project uuid
require('../../config')
require('lib/databases/mongo')
const _ = require('lodash')

const Logger = require('lib/utils/logger')
const moment = require('moment')
const sendSlackNotificacion = require('tasks/slack/send-message-to-channel')
const Task = require('lib/task')
const { DataSet, DataSetRow, HistoricalDatasetRow, Project } = require('models')

const task = new Task(
  async function (argv) {
    const log = new Logger('restore-rows-from-historical')

    if (!argv.dataset) {
      throw new Error('You need to provide a project!')
    }

    const batchSize = 100000
    log.call(`Start ==>  ${moment().format()}`)

    const dataset = await DataSet.find({'uuid': argv.dataset})
    log.call('Restoring dataset => ' + dataset.uuid)
    try {
      log.call('Obtaining rows to copy...')
      let sizeRows = await HistoricalDatasetRow.find({dataset: dataset._id}).count()

      const rows = await HistoricalDatasetRow.aggregate([
          {'$match': {
            dataset: dataset._id
          }}
        ]).cursor({batchSize: batchSize}).exec()

      log.call('Rows ready, transversing...')
      let bulkOpsNew = []

      while(await rows.hasNext()) {
        const row = await rows.next()
        bulkOpsNew.push({
          'organization': project.organization,
          'project': project,
          'dataset': dataset._id,
          'product': row.product,
          'newProduct': row.newProduct,
          'cycle': row.cycle,
          'period': row.period,
          'data': row.data,
          'apiData': row.apiData,
          'catalogItems': row.catalogItems
        })

        if (bulkOpsNew.length === batchSize) {
          await DataSetRow.insertMany(bulkOpsNew)
          sizeRows = sizeRows - batchSize
          log.call('rows pending for this dataset => ' + sizeRows)
          bulkOpsNew = []
        }
      }

      if (bulkOpsNew.length > 0) {
        await DataSetRow.insertMany(bulkOpsNew)
      }

      log.call('last bulk saved for this dataset => ' + bulkOpsNew.length)
    } catch (e) {
      log.call(e)
      continue
    }

    log.call(`End ==> ${moment().format()}`)
    return true
  },
  async (argv) => {
    sendSlackNotificacion.run({
      channel: 'all',
      message: "The restore of rows is working."
    })
  },
  async (argv) => {
    sendSlackNotificacion.run({
      channel: 'all',
      message: "the restore of rows was Successfully"
    })
  }
)

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
