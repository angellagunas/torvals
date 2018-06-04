// node tasks/project/clone.js --project1 uuid --project2 uuid [--batchSize batchSize]
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
    if (!argv.project1) {
      throw new Error('You need to provide a project!')
    }

    if (!argv.project2) {
      throw new Error('You need to provide a project to clone to!')
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

    const project = await Project.findOne({uuid: argv.project1})
      .populate('mainDataset')

    if (!project) {
      throw new Error('Invalid project!')
    }

    if (!project.mainDataset) {
      log("Project doesn't have a Main dataset!")

      return false
    }

    log(`Cloning project ${project.name}`)

    let newProjectData = {
      status: 'cloning',
      showOnDashboard: false,
      etag: project.etag,
      dateMin: project.dateMin,
      dateMax: project.dateMax
    }

    let newProject = await Project.findOne({uuid: argv.project2})
    newProject.set(newProjectData)
    newProject.save()

    let dat = project.mainDataset
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
      status: 'cloning',
      source: dat.source,
      columns: _.cloneDeep(dat.columns),
      groupings: _.cloneDeep(dat.groupings),
      salesCenter: _.cloneDeep(dat.salesCenter),
      products: _.cloneDeep(dat.products),
      channels: _.cloneDeep(dat.channels),
      apiData: _.cloneDeep(dat.apiData),
      isDeleted: false,
      isMain: true,
      uploaded: dat.uploaded
    }

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

    auxDataset.set({
      status: 'ready',
      project: newProject
    })

    auxDataset.save()

    newProject.datasets.push({
      columns: [],
      dataset: auxDataset
    })

    newProject.set({
      status: 'pendingRows',
      mainDataset: auxDataset
    })
    newProject.save()

    log(`Successfully cloned project ${project.name}!`)
    log(`End ==> ${moment().format()}`)

    return true
  },
  async (argv) => {
    if (!argv.project1) {
      throw new Error('You need to provide a project!')
    }

    if (!argv.project2) {
      throw new Error('You need to provide a project to clone to!')
    }

    const project = await Project.findOne({uuid: argv.project1})

    if (!project) {
      throw new Error('Invalid project!')
    }

    sendSlackNotificacion.run({
      channel: 'all',
      message: `Se ha iniciado el proceso para generar un clon del proyecto *${project.name}*`
    })
  },
  async (argv) => {
    if (!argv.project1) {
      throw new Error('You need to provide a project!')
    }

    if (!argv.project2) {
      throw new Error('You need to provide a project to clone to!')
    }

    const project = await Project.findOne({uuid: argv.project1})

    if (!project) {
      throw new Error('Invalid project!')
    }

    sendSlackNotificacion.run({
      channel: 'all',
      message: `Se ha finalizado correctamente el proceso para generar un ` +
      `clon del proyecto *${project.name}* `,
      attachment: {
        title: 'Exito!',
        image_url: 'https://i.imgur.com/GfHWtUx.gif'
      }
    })
  }
)

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
