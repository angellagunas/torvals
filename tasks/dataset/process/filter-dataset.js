// node tasks/dataset/process/filter-dataset.js --project uuid --dataset uuid [--batchSize batchSize --noNextStep]
require('../../../config')
require('lib/databases/mongo')
const _ = require('lodash')
const generateCycles = require('tasks/organization/generate-cycles')

const Logger = require('lib/utils/logger')
const moment = require('moment')
const sendSlackNotificacion = require('tasks/slack/send-message-to-channel')
const Task = require('lib/task')
const { Organization, Project, DataSet, DataSetRow, Cycle } = require('models')

const task = new Task(
  async function (argv) {
    const log = new Logger('filter-dataset')

    if (!argv.project) {
      throw new Error('You need to provide a project!')
    }

    if (!argv.dataset) {
      throw new Error('You need to provide a dataset!')
    }

    let batchSize = 10000
    if (argv.batchSize) {
      try {
        batchSize = parseInt(argv.batchSize)
      } catch (e) {
        log.call('Invalid batch size! Using default of 10000...')
      }
    }

    let i = 0
    log.call('Fetching Project...')
    log.call(`Using batch size of ${batchSize}`)
    log.call(`Start ==>  ${moment().format()}`)

    const project = await Project.findOne({uuid: argv.project}).populate('mainDataset rule')
    const dataset = await DataSet.findOne({uuid: argv.dataset})
    const organization = await Organization.findOne({_id: project.organization})

    if (!project || !dataset || !organization) {
      throw new Error('Invalid organization, project or dataset!')
    }

    if (!project.mainDataset) {
      log.call("Error! There's no main dataset to filter from!")
      log.call(`End ==> ${moment().format()}`)

      dataset.set({
        status: 'error',
        error: "Error! There's no main dataset to filter from!"
      })
      await dataset.save()

      return true
    }

    const cycles = project.rule.cyclesAvailable
    let cyclesAvailable = await Cycle.getAvailable(organization._id, project.rule._id, cycles)
    if (cyclesAvailable.length < cycles) {
      log.call('Creating missing cycles.')

      await generateCycles.run({
        uuid: organization.uuid, rule: project.rule.uuid, extraDate: dataset.dateMin })

      await generateCycles.run({
        uuid: organization.uuid, rule: project.rule.uuid, extraDate: dataset.dateMax })

      cyclesAvailable = await Cycle.getAvailable(organization._id, project.rule._id, cycles)
    }

    log.call('Obtaining rows to copy...')
    try {
      const rows = await DataSetRow.find({
        dataset: project.mainDataset,
        'cycle': {
          $in: cyclesAvailable.map(val => { return val._id })
        },
        isAnomaly: false
      }).cursor()

      log.call('Rows ready, transversing...')
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
        }
        )

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

      log.call('Obtaining max and min dates...')
      const dateMin = moment.utc(cyclesAvailable[0].dateStart)
      let dateMax = moment.utc(cyclesAvailable[cyclesAvailable.length - 1].dateStart)

      dataset.set({
        dateMax: dateMax.format('YYYY-MM-DD'),
        dateMin: dateMin.format('YYYY-MM-DD'),
        status: 'adjustment',
        rule: project.rule._id
      })
      await dataset.save()

      project.set({
        status: 'adjustment'
      })
      await project.save()

      log.call(`Successfully generated dataset ${dataset.name} for adjustment`)
    } catch (e) {
      log.call(e)
      dataset.set({
        status: 'error',
        error: e.message
      })
      await dataset.save()

      return false
    }

    log.call(`End ==> ${moment().format()}`)

    return true
  },
  async (argv) => {
    if (!argv.project) {
      throw new Error('You need to provide a project!')
    }

    const project = await Project.findOne({uuid: argv.project})
    if (!project) {
      throw new Error('Invalid project or dataset!')
    }

    sendSlackNotificacion.run({
      channel: 'all',
      message: `Se esta generando el dataset de ajuste del proyecto *${project.name}*`
    })
  },
  async (argv) => {
    if (!argv.project) {
      throw new Error('You need to provide a project!')
    }

    const project = await Project.findOne({uuid: argv.project})
    if (!project) {
      throw new Error('Invalid project or dataset!')
    }

    sendSlackNotificacion.run({
      channel: 'all',
      message: `El dataset de ajuste del proyecto *${project.name}* se encuentra listo!`
    })
  }
)

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
