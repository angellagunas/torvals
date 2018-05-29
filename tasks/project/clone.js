// node tasks/project/clone.js --uuid uuid [--batchSize batchSize]
require('../../config')
require('lib/databases/mongo')
const moment = require('moment')
const _ = require('lodash')

const Task = require('lib/task')
const { Project, DataSet, DataSetRow } = require('models')
const sendSlackNotificacion = require('tasks/slack/send-message-to-channel')

const task = new Task(
  async function (argv) {
    let log = (args) => {
      args = ('[clone-project] ') + args

      console.log(args)
    }

    var batchSize = 10000
    if (!argv.uuid) {
      throw new Error('You need to provide a project!')
    }

    if (argv.batchSize) {
      try {
        batchSize = parseInt(argv.batchSize)
      } catch (e) {
        log('Invalid batch size! Using default ...')
      }
    }

    let i = 0
    log('Fetching Project...')
    log(`Using batch size of ${batchSize}`)
    log(`Start ==>  ${moment().format()}`)

    const project = await Project.findOne({uuid: argv.uuid})
      .populate('mainDataset')
      .populate('datasets.dataset')

    if (!project) {
      throw new Error('Invalid project!')
    }

    if (!project.mainDataset) {
      log("Project doesn't have a Main dataset!")
    }

    log(`Cloning project ${project.name}`)

    let newProject = {
      name: project.name + ' (clone)',
      organization: project.organization,
      description: project.description,
      status: project.status,
      showOnDashboard: project.showOnDashboard,
      mainDataset: project.mainDataset,
      activeDataset: project.activeDataset,
      etag: project.etag,
      dateMin: project.dateMin,
      dateMax: project.dateMax,
      dateCreated: project.dateCreated,
      createdBy: project.createdBy
    }

    newProject = await Project.create(newProject)

    for (let dat of project.datasets) {
      dat = dat.dataset
      log(`Cloning dataset ${dat.name}`)

      let auxDataset = {
        name: dat.name,
        description: dat.description,
        path: {
          url: dat.path.url,
          bucket: dat.path.bucket,
          region: dat.path.region,
          savedToDisk: dat.path.savedToDisk
        },
        fileChunk: dat.fileChunk,
        organization: dat.organization,
        project: newProject._id,
        createdBy: dat.createdBy,
        uploadedBy: dat.uploadedBy,
        conciliatedBy: dat.conciliatedBy,
        type: dat.type,
        dateMax: dat.dateMax,
        dateMin: dat.dateMin,
        error: dat.error,
        etag: dat.etag,
        status: dat.status,
        source: dat.source,
        columns: _.cloneDeep(dat.columns),
        groupings: _.cloneDeep(dat.groupings),
        salesCenter: _.cloneDeep(dat.salesCenter),
        products: _.cloneDeep(dat.products),
        channels: _.cloneDeep(dat.channels),
        apiData: _.cloneDeep(dat.apiData),
        dateCreated: dat.dateCreated,
        dateConciliated: dat.dateConciliated,
        isDeleted: dat.isDeleted,
        uploaded: dat.uploaded
      }

      console.log(auxDataset.path)
      console.log(auxDataset.columns)
      console.log(auxDataset.groupings)
      console.log(auxDataset.salesCenter)
      console.log(auxDataset.products)
      console.log(auxDataset.channels)
      console.log(auxDataset.apiData)

      auxDataset = await DataSet.create(auxDataset)

      log(`Cloning rows of dataset ${dat.name}`)

      let rows = await DataSetRow.find({
        dataset: dat
      }).cursor()

      let bulkOpsNew = []
      for (let row = await rows.next(); row != null; row = await rows.next()) {
        let auxRow = {
          organization: row.organization,
          project: newProject._id,
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
    }

    log(`Successfully cloned project ${project.name}!`)
    log(`End ==> ${moment().format()}`)

    return true
  },
  async (argv) => {
    if (!argv.uuid) {
      throw new Error('You need to provide a project!')
    }

    const project = await Project.findOne({uuid: argv.uuid})

    if (!project) {
      throw new Error('Invalid project!')
    }

    sendSlackNotificacion.run({
      channel: 'opskamino',
      message: `Se ha iniciado el proceso para generar un clon del proyecto *${project.name}*`
    })
  },
  async (argv) => {
    if (!argv.uuid) {
      throw new Error('You need to provide a project!')
    }

    const project = await Project.findOne({uuid: argv.uuid})

    if (!project) {
      throw new Error('Invalid project!')
    }

    sendSlackNotificacion.run({
      channel: 'opskamino',
      message: `Se ha finalizado correctamente el proceso para generar un clon del proyecto *${project.name}*`
    })
  }
)

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
