// node tasks/project/clone.js --project1 uuid --project2 uuid [--batchSize batchSize]
require('../../../config')
require('lib/databases/mongo')
const moment = require('moment')
const _ = require('lodash')

const Task = require('lib/task')
const { Project, DataSet, DataSetRow } = require('models')
const sendSlackNotificacion = require('tasks/slack/send-message-to-channel')

const task = new Task(
  async function (argv) {
    let log = (args) => {
      args = ('[clone-dataset] ') + args

      console.log(args)
    }

    var batchSize = 10000
    if (!argv.dataset) {
      throw new Error('You need to provide a dataset!')
    }

    if (argv.batchSize) {
      try {
        batchSize = parseInt(argv.batchSize)
      } catch (e) {
        log('Invalid batch size! Using default ...')
      }
    }

    let i = 0
    log('Fetching Datasets...')
    log(`Using batch size of ${batchSize}`)
    log(`Start ==>  ${moment().format()}`)

    const dataset = await DataSet.findOne({uuid: argv.dataset})
      .populate('project')

    if (!dataset) {
      throw new Error('Invalid dataset!')
    }

    log(`Cloning dataset ${dataset.name}`)

    let auxDataset = {
      name: dataset.name,
      description: dataset.description,
      path: {
        url: dataset.path.url,
        bucket: dataset.path.bucket,
        region: dataset.path.region,
        savedToDisk: dataset.path.savedToDisk
      },
      fileChunk: dataset.fileChunk,
      organization: dataset.organization,
      project: dataset.project,
      createdBy: dataset.createdBy,
      uploadedBy: dataset.uploadedBy,
      conciliatedBy: dataset.conciliatedBy,
      type: dataset.type,
      dateMax: dataset.dateMax,
      dateMin: dataset.dateMin,
      error: dataset.error,
      etag: dataset.etag,
      status: 'cloning',
      source: dataset.source,
      columns: _.cloneDeep(dataset.columns),
      groupings: _.cloneDeep(dataset.groupings),
      salesCenter: _.cloneDeep(dataset.salesCenter),
      products: _.cloneDeep(dataset.products),
      channels: _.cloneDeep(dataset.channels),
      apiData: _.cloneDeep(dataset.apiData),
      catalogItems: _.cloneDeep(dataset.catalogItems),
      cycles: _.cloneDeep(dataset.cycles),
      periods: _.cloneDeep(dataset.periods),
      isDeleted: false,
      isMain: true,
      uploaded: dataset.uploaded,
      rule: dataset.rule
    }

    auxDataset = await DataSet.create(auxDataset)

    log(`Cloning rows of dataset ${dataset.name}`)

    let rows = await DataSetRow.find({
      dataset: dataset
    }).cursor()

    let bulkOpsNew = []
    for (let row = await rows.next(); row != null; row = await rows.next()) {
      let auxRow = {
        organization: row.organization,
        project: dataset.project,
        dataset: auxDataset._id,
        salesCenter: row.salesCenter,
        product: row.product,
        channel: row.channel,
        adjustmentRequest: row.adjustmentRequest,
        status: row.status,
        data: row.data,
        apiData: row.apiData,
        updatedBy: row.updatedBy,
        dateCreated: row.dateCreated,
        catalogData: row.catalogData,
        catalogItems: row.catalogItems,
        cycle: row.cycle,
        period: row.period,
        isDeleted: row.isDeleted,
        isAnomaly: row.isAnomaly
      }
      bulkOpsNew.push(auxRow)

      if (bulkOpsNew.length === batchSize) {
        log(`${i} => ${batchSize} ops new => ${moment().format()}`)
        await DataSetRow.insertMany(bulkOpsNew)
        bulkOpsNew = []
        i++
      }
    }

    log(bulkOpsNew.length)
    if (bulkOpsNew.length > 0) {
      await DataSetRow.insertMany(bulkOpsNew)
    }

    auxDataset.set({
      status: dataset.status
    })

    auxDataset.save()

    log(`Successfully cloned dataset ${dataset.name}!`)
    log(`End ==> ${moment().format()}`)

    return auxDataset.uuid
  }
)

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
