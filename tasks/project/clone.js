// node tasks/project/clone.js --project1 uuid --project2 uuid [--batchSize batchSize]
require('../../config')
require('lib/databases/mongo')
const moment = require('moment')
const _ = require('lodash')

const Task = require('lib/task')
const { Project, DataSet, Anomaly } = require('models')
const cloneDataset = require('tasks/dataset/process/clone')
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
      dateMax: project.dateMax,
      rule: project.rule
    }

    let newProject = await Project.findOne({uuid: argv.project2})
    newProject.set(newProjectData)
    newProject.save()

    let newDataset = await cloneDataset.run({dataset: project.mainDataset.uuid})
    newDataset = await DataSet.findOne({uuid: newDataset})

    newDataset.set({
      status: 'ready',
      project: newProject
    })

    newDataset.save()

    newProject.datasets.push({
      columns: [],
      dataset: newDataset
    })

    newProject.set({
      status: 'pendingRows',
      mainDataset: newDataset
    })
    newProject.save()

    log(`Cloning anomalies of ${project.name}`)

    const anomalies = await Anomaly.find({
      project: project,
      isDeleted: false
    }).cursor()
    let bulkOps = []

    for (let row = await anomalies.next(); row != null; row = await anomalies.next()) {
      try {
        bulkOps.push({
          salesCenter: row.salesCenter,
          product: row.product,
          channel: row.channel,
          project: newProject._id,
          prediction: row.prediction,
          organization: newProject.organization,
          type: 'zero_sales',
          date: row.date,
          apiData: row.apiData,
          period: row.period,
          cycle: row.cycle,
          data: row.data,
          catalogItems: row.catalogItems
        })

        if (bulkOps.length === batchSize) {
          log(`${batchSize} anomalies saved! => ${moment().format()}`)
          await Anomaly.insertMany(bulkOps)
          bulkOps = []
        }
      } catch (e) {
        log('Error trying to save anomalies: ')
        log(e)
      }
    }

    try {
      if (bulkOps.length > 0) {
        await Anomaly.insertMany(bulkOps)
      }
    } catch (e) {
      log('Error trying to save anomalies: ')
      log(e)
    }

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
