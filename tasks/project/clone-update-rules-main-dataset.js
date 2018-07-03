// node tasks/project/clone-update-rules-main-dataset.js --uuid uuid --batchSize
require('../../config')
require('lib/databases/mongo')
const Logger = require('lib/utils/logger')
const moment = require('moment')
const cloneDataset = require('tasks/dataset/process/clone')
const sendSlackNotification = require('tasks/slack/send-message-to-channel')
const Task = require('lib/task')
const checkProjectCycleStatus = require('tasks/project/verify-cycle-status')
const { Project, DataSet } = require('models')

const task = new Task(
  async function (argv) {
    const log = new Logger('clone-update-rules-MD')

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

    log.call(`Fetching project ${argv.uuid} ...`)
    log.call(`Using batch size of ${batchSize}`)
    log.call(`Start ==>  ${moment().format()}`)

    const project = await Project.findOne({
      uuid: argv.uuid,
      isDeleted: false
    }).populate('mainDataset').populate('rule')
    await project.rule.populate('catalogs').execPopulate()

    const projectCatalogs = project.rule.catalogs.map(item => { return item.slug })

    if (!project || !project.mainDataset) {
      throw new Error('Invalid project.')
    }

    log.call('Create new dataset.')
    let auxDataset = await cloneDataset.run({dataset: project.mainDataset.uuid})
    auxDataset = await DataSet.findOne({uuid: auxDataset}).populate('rule')
    await auxDataset.rule.populate('catalogs').execPopulate()
    const datasetCatalogs = auxDataset.rule.catalogs.map(item => { return item.slug })

    const catalogsToRemove = datasetCatalogs.filter(item => {
      return projectCatalogs.indexOf(item) < 0
    })

    let newCols = auxDataset.columns

    for (let col of newCols) {
      for (let cat of catalogsToRemove) {
        let idStr = `is_${cat}_id`
        let nameStr = `is_${cat}_name`
        if (col[idStr]) col[idStr] = false
        if (col[nameStr]) col[nameStr] = false
      }
    }

    auxDataset.set({
      status: 'configuring',
      isMain: true,
      rule: project.rule,
      columns: newCols
    })
    auxDataset.markModified('columns')
    await auxDataset.save()

    project.mainDataset.set({
      status: 'ready',
      isMain: false
    })
    await project.mainDataset.save()

    let auxDatasets = project.datasets.map(item => { return item.dataset.uuid })

    let pos = auxDatasets.indexOf(project.mainDataset.uuid)

    if (pos > 0) {
      project.datasets.splice(pos, 1)
    }

    project.set({
      mainDataset: auxDataset._id,
      status: 'pending-configuration'
    })
    project.datasets.push({
      dataset: auxDataset,
      columns: []
    })
    await project.save()

    await checkProjectCycleStatus.run()

    return true
  },
  async (argv) => {
    if (!argv.uuid) {
      throw new Error('You need to provide an uuid!')
    }

    const project = await Project.findOne({
      uuid: argv.uuid,
      isDeleted: false
    })

    if (!project) {
      throw new Error('Invalid project.')
    }

    sendSlackNotification.run({
      channel: 'all',
      message: `Se ha iniciado el proceso para actualizar las reglas del proyecto` +
        `*${project.name}* `
    })
  },
  async (argv) => {
    if (!argv.uuid) {
      throw new Error('You need to provide an uuid!')
    }

    const project = await Project.findOne({
      uuid: argv.uuid,
      isDeleted: false
    })

    if (!project) {
      throw new Error('Invalid project.')
    }

    sendSlackNotification.run({
      channel: 'all',
      message: `Se ha generado un clon del main dataset del projecto *${project.name}* ` +
        `y esta listo para ser configurado con las nuevas reglas de negocio!`,
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
