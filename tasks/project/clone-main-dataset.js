// node tasks/project/update-business-rules.js --uuid uuid --batchSize
require('../../config')
require('lib/databases/mongo')
const Logger = require('lib/utils/logger')
const moment = require('moment')
const path = require('path')
const sendSlackNotification = require('tasks/slack/send-message-to-channel')
const Task = require('lib/task')
const { v4 } = require('uuid')
const { execSync } = require('child_process')
const { Project, DataSet, DataSetRow } = require('models')

const task = new Task(
  async function (argv) {
    const log = new Logger('clone-main-dataset')

    if (!argv.uuid) {
      throw new Error('You need to provide an uuid!')
    }

    let batchSize = 10000
    if (argv.batchSize) {
      try {
        batchSize = parseInt(argv.batchSize)
      } catch (e) {
        log.call('Invalid batch size!')
      }
    }

    log.call(`Fetching project main dataset ${argv.uuid} ...`)
    log.call(`Using batch size of ${batchSize}`)
    log.call(`Start ==>  ${moment().format()}`)

    const project = await Project.findOne({
      uuid: argv.uuid,
      isDeleted: false
    }).populate('mainDataset')
    if (!project || !project.mainDataset) {
      throw new Error('Invalid project.')
    }

    let auxDataset = {
      ...project.mainDataset._doc
    }
    auxDataset.uuid = v4()
    delete auxDataset._id

    log.call('Create new dataset.')
    auxDataset = await DataSet.create(auxDataset)

    log.call('Create bulk rows.')
    let rows = await DataSetRow.find({
      dataset: project.mainDataset._id
    }).cursor()

    let bulkOpsNew = []
    let i = 0
    for (let row = await rows.next(); row != null; row = await rows.next()) {
      let auxRow = {
        organization: row.organization,
        project: project._id,
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
        isDeleted: row.isDeleted,
        isAnomaly: row.isAnomaly
      }
      bulkOpsNew.push(auxRow)

      if (bulkOpsNew.length === batchSize) {
        log.call(`${i} => ${batchSize} ops new => ${moment().format()}`)
        await DataSetRow.insertMany(bulkOpsNew)
        bulkOpsNew = []
        i++
      }
    }

    log.call(bulkOpsNew.length)
    if (bulkOpsNew.length > 0) {
      await DataSetRow.insertMany(bulkOpsNew)
    }

    auxDataset.set({
      status: 'configuring',
      isMain: true
    })
    await auxDataset.save()

    project.mainDataset.set({
      status: 'ready',
      isMain: false
    })
    await project.mainDataset.save()

    project.set({
      mainDataset: auxDataset._id,
      status: 'updating-rules'
    })
    project.datasets.push({
      dataset: auxDataset,
      columns: []
    })
    await project.save()

    return true
  },
  async (argv) => {
    if (!argv.uuid) {
      throw new Error('You need to provide an uuid!')
    }
  },
  async (argv) => {
    if (!argv.uuid) {
      throw new Error('You need to provide an uuid!')
    }
  }
)

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
