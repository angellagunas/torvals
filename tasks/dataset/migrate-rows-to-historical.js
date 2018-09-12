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
    const batchSize = 10000
    log.call(`Start ==>  ${moment().format()}`)

    const projects = await Project.find({})

    for(project of projects){
      log.call('project => ' + project.uuid)
      const excludeFilters = []
      if(project.mainDataset){ excludeFilters.push(project.mainDataset) }
      if(project.activeDataset){ excludeFilters.push(project.activeDataset) }

      const datasets = await DataSet.find({project: project._id, _id: {$nin: excludeFilters}})
      for(dataset of datasets){
        log.call('dataset => ' + dataset.uuid)
        try {
          /*
           * Old dataset rows
           */
          log.call('Obtaining rows to copy...')
          const rows = await DataSetRow.find({ dataset: dataset._id }).cursor()

          log.call('Rows ready, transversing...')

          const idsMigratedRows = []
          let bulkOpsNew = []

          for (let row = await rows.next(); row != null; row = await rows.next()) {
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

            idsMigratedRows.push(row._id)

            if (bulkOpsNew.length === batchSize) {
              /*
               * save the dataset rows on historical
               */
              await HistoricalDatasetRow.insertMany(bulkOpsNew)
              bulkOpsNew = []
            }
          }

          log.call('Deleting rows from datasetrows...')
          log.call(JSON.stringify(idsMigratedRows))
          await DataSetRow.deleteMany({ '_id': {'$in': idsMigratedRows}})

          log.call(bulkOpsNew.length)
          if (bulkOpsNew.length > 0) { await HistoricalDatasetRow.insertMany(bulkOpsNew)}
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
