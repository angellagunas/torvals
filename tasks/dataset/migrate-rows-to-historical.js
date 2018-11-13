// node tasks/dataset/migrate-rows-to-historical.js
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
    const log = new Logger('migrate-rows-to-historical')
    const batchSize = 100000
    log.call(`Start ==>  ${moment().format()}`)

    const projects = await Project.find({isDeleted: false})
    const rowsLength = await DataSetRow.find({
      project: {'$in': projects.map(item => Object(item._id))}
    }).count()
    let counter = 1

    log.call('Tentative total rows length => ' + rowsLength)

    for(project of projects){
      log.call('Migrating project => ' + project.uuid)
      const includeFilters = []

      if(project.mainDataset){ includeFilters.push(project.mainDataset) }
      if(project.activeDataset){ includeFilters.push(project.activeDataset) }

      const datasets = await DataSet.find({
        'project': project._id,
        '_id': { '$in': includeFilters }
      })

      for(dataset of datasets){
        log.call('Migrating dataset => ' + dataset.uuid)
        try {
          log.call('Obtaining rows to copy...')
          let sizeRows = await DataSetRow.find({dataset: dataset._id}).count()

          const rows = await DataSetRow.aggregate([
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
              await HistoricalDatasetRow.insertMany(bulkOpsNew)
              sizeRows = sizeRows - batchSize
              log.call('rows pending for this dataset => ' + sizeRows)
              counter = counter + 1
              bulkOpsNew = []
            }
          }

          if (bulkOpsNew.length > 0) {
            await HistoricalDatasetRow.insertMany(bulkOpsNew)
          }

          log.call('last bulk saved for this dataset => ' + bulkOpsNew.length)
        } catch (e) {
          log.call(e)
          continue
        }
      }
    }

    log.call(`End ==> ${moment().format()}`)
    return true
  },
  async (argv) => {
    sendSlackNotificacion.run({
      channel: 'all',
      message: "The migration of rows is working."
    })
  },
  async (argv) => {
    sendSlackNotificacion.run({
      channel: 'all',
      message: "the migration of rows was Successfully"
    })
  }
)

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
