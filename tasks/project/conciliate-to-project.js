// node tasks/project/conciliate-to-project.js --project uuid --dataset uuid [--batchSize batchSize]
require('../../config')
require('lib/databases/mongo')
const moment = require('moment')
const _ = require('lodash')

const Task = require('lib/task')
const { Project, DataSet } = require('models')
const getAnomalies = require('queues/get-anomalies')
const conciliateDataset = require('tasks/dataset/process/conciliate-dataset')
const sendSlackNotificacion = require('tasks/slack/send-message-to-channel')

const task = new Task(
  async function (argv) {
    let log = (args) => {
      args = ('[conciliate-to-project] ') + args

      console.log(args)
    }

    if (!argv.project) {
      throw new Error('You need to provide a project!')
    }

    if (!argv.dataset) {
      throw new Error('You need to provide a dataset!')
    }

    log('Fetching Dataset and project...')
    log(`Start ==>  ${moment().format()}`)

    const project = await Project.findOne({uuid: argv.project}).populate('mainDataset')
    const dataset = await DataSet.findOne({uuid: argv.dataset})

    if (!project || !dataset) {
      throw new Error('Invalid project or dataset!')
    }

    if (String(dataset.project) !== String(project._id)) {
      throw new Error('Cannot conciliate a dataset from another project!')
    }

    if(!dataset.dateMin || !dataset.dateMax){
      throw new Error('Invalid dateMax or dateMin')
    }

    if (!project.mainDataset) {
      project.set({
        mainDataset: dataset._id,
        dateMin: moment.utc(dataset.dateMin, 'YYYY-MM-DD'),
        dateMax: moment.utc(dataset.dateMax, 'YYYY-MM-DD')
      })
      dataset.set({
        isMain: true,
        status: 'ready'
      })

      await dataset.save()
      await project.save()
      log(`Successfully conciliated dataset ${dataset.name} into project ${project.name}`)
      log(`End ==> ${moment().format()}`)
      return true
    }

    log([project.mainDataset._id, dataset._id])

    try {
      let newDataset = await conciliateDataset.run({
        dataset1: project.mainDataset.uuid,
        dataset2: dataset.uuid
      })

      newDataset = await DataSet.findOne({uuid: newDataset})
      project.set({
        mainDataset: newDataset._id,
        dateMin: moment.utc(newDataset.dateMin, 'YYYY-MM-DD'),
        dateMax: moment.utc(newDataset.dateMax, 'YYYY-MM-DD')
      })

      await project.save()

      log(`Successfully conciliated dataset ${dataset.name} into project ${project.name}`)
    } catch (e) {
      console.log(e)
      dataset.set({
        status: 'error',
        error: e.message
      })

      await dataset.save()

      return false
    }

    log(`End ==> ${moment().format()}`)

    return true
  },
  async (argv) => {
    if (!argv.project) {
      throw new Error('You need to provide a project!')
    }

    if (!argv.dataset) {
      throw new Error('You need to provide a dataset!')
    }

    const project = await Project.findOne({uuid: argv.project})
    const dataset = await DataSet.findOne({uuid: argv.dataset})

    if (!project || !dataset) {
      throw new Error('Invalid project or dataset!')
    }

    sendSlackNotificacion.run({
      channel: 'all',
      message: `El dataset *${dataset.name}* ha iniciado el proceso de conciliacion ` +
      `al proyecto *${project.name}*`
    })
  },
  async (argv) => {
    if (!argv.project) {
      throw new Error('You need to provide a project!')
    }

    if (!argv.dataset) {
      throw new Error('You need to provide a dataset!')
    }

    const project = await Project.findOne({uuid: argv.project})
    const dataset = await DataSet.findOne({uuid: argv.dataset})

    if (!project || !dataset) {
      throw new Error('Invalid project or dataset!')
    }

    getAnomalies.add({uuid: project.uuid})

    sendSlackNotificacion.run({
      channel: 'all',
      message: `El dataset *${dataset.name}* se ha conciliado al proyecto *${project.name}*`
    })
  }
)

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
