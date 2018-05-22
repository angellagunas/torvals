// node tasks/migrations/set-week-datasetrows.js
require('../../../config')
require('lib/databases/mongo')
const moment = require('moment')

const Task = require('lib/task')
const { Project, DataSet, DataSetRow } = require('models')
const sendSlackNotificacion = require('tasks/slack/send-message-to-channel')

const task = new Task(
  async function (argv) {
    let log = (args) => {
      args = ('[filter-dataset] ') + args

      console.log(args)
    }

    var batchSize = 10000
    if (!argv.project) {
      throw new Error('You need to provide a project!')
    }

    if (!argv.dataset) {
      throw new Error('You need to provide a dataset!')
    }

    if (!argv.dateStart || !argv.dateEnd) {
      throw new Error('You need to provide a start and end date!')
    }

    let dateStart = moment.utc(argv.dateStart, 'YYYY-MM-DD')
    let dateEnd = moment.utc(argv.dateEnd, 'YYYY-MM-DD')

    if (argv.batchSize) {
      try {
        batchSize = parseInt(argv.batchSize)
      } catch (e) {
        log('Invalid batch size! Using default of 10000 ...')
      }
    }

    let i = 0
    log('Fetching Project...')
    log(`Using batch size of ${batchSize}`)
    log(`Start ==>  ${moment().format()}`)

    const project = await Project.findOne({uuid: argv.project})

    const dataset = await DataSet.findOne({uuid: argv.dataset})

    if (!project || !dataset) {
      throw new Error('Invalid project or dataset!')
    }

    if (!project.mainDataset) {
      log("Error! There's no main dataset to filter from!")
      log(`End ==> ${moment().format()}`)

      dataset.set({
        status: 'error',
        error: "Error! There's no main dataset to filter from!"
      })
      await dataset.save()

      return true
    }

    log('Obtaining rows to copy ...')

    try {
      const rows = await DataSetRow.find({
        dataset: project.mainDataset,
        'data.forecastDate': { $gte: dateStart, $lte: dateEnd }
      }).cursor()

      log('rows ready, transversing ...')

      var bulkOpsNew = []
      for (let row = await rows.next(); row != null; row = await rows.next()) {
        bulkOpsNew.push(
          {
            'organization': project.organization,
            'project': project,
            'dataset': dataset._id,
            'channel': row.channel,
            'salesCenter': row.salesCenter,
            'product': row.product,
            'data': row.data,
            'apiData': row.apiData
          }
      )

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

      log('Obtaining max and min dates ...')

      dataset.set({
        dateMax: dateEnd.format('YYYY-MM-DD'),
        dateMin: dateStart.format('YYYY-MM-DD'),
        status: 'adjustment'
      })

      await dataset.save()

      project.set({
        status: 'adjustment'
      })

      await project.save()

      log(`Successfully generated dataset ${dataset.name} for adjustment`)
    } catch (e) {
      log(e)
      dataset.set({
        status: 'error',
        error: e.message
      })

      await dataset.save()

      return false
    }

    log(`End ==> ${moment().format()}`)
    await sendSlackNotificacion.run({
      channel: 'opskamino',
      message: `El dataset de ajuste del proyecto *${project.name}* se encuentra listo!`
    })

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
      channel: 'opskamino',
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
      channel: 'opskamino',
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
