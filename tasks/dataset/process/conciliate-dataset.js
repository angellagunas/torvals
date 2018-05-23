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
      args = ('[conciliate-dataset] ') + args

      console.log(args)
    }

    var batchSize = 10000
    if (!argv.project) {
      throw new Error('You need to provide a project!')
    }

    if (!argv.dataset) {
      throw new Error('You need to provide a dataset!')
    }

    if (argv.batchSize) {
      try {
        batchSize = parseInt(argv.batchSize)
      } catch (e) {
        console.log('Invalid batch size! Using default of 1000 ...')
      }
    }

    let i = 0
    log('Fetching Dataset and project...')
    log(`Using batch size of ${batchSize}`)
    log(`Start ==>  ${moment().format()}`)

    const project = await Project.findOne({uuid: argv.project}).populate('mainDataset')
    const dataset = await DataSet.findOne({uuid: argv.dataset})

    if (!project || !dataset) {
      throw new Error('Invalid project or dataset!')
    }

    if (!project.mainDataset) {
      project.set({
        mainDataset: dataset._id,
        status: 'pendingRows',
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

    let match = {
      '$match': {
        dataset: {$in: [project.mainDataset._id, dataset._id]}
      }
    }

    log([project.mainDataset._id, dataset._id])

    const key = {
      date: '$data.forecastDate',
      product: '$product',
      salesCenter: '$salesCenter',
      channel: '$channel',
      week: '$data.semanaBimbo'
    }

    match = [
      match,
      {
        '$group': {
          _id: key,
          mergedRows: { $mergeObjects: '$$ROOT' }
        }
      },
    { '$replaceRoot': { newRoot: '$mergedRows' } }
    ]

    log('Obtaining aggregate ...')

    try {
      const rows = await DataSetRow.aggregate(match).allowDiskUse(true).cursor({batchSize: batchSize * 10}).exec()

      let newDataset = await DataSet.create({
        name: 'Main Dataset',
        project: project,
        organization: project.organization,
        createdBy: dataset.createdBy,
        uploadedBy: dataset.uploadedBy,
        conciliatedBy: dataset.conciliatedBy,
        dateMax: dataset.dateMax,
        dateMin: dataset.dateMin,
        columns: dataset.columns,
        salesCenters: dataset.salesCenters,
        products: dataset.products,
        channels: dataset.channels,
        newSalesCenters: dataset.newSalesCenters,
        newProducts: dataset.newProducts,
        isMain: true,
        newChannels: dataset.newChannels,
        groupings: dataset.groupings,
        apiData: dataset.apiData,
        source: 'conciliation',
        status: 'conciliated'
      })

      log('Aggregate ready, transversing ...')

      var bulkOpsEdit = []
      var bulkOpsNew = []
      for (let row = await rows.next(); row != null; row = await rows.next()) {
        bulkOpsNew.push(
          {
            ...row,
            _id: undefined,
            'organization': project.organization,
            'project': project,
            'dataset': newDataset._id
          }
      )

        if (bulkOpsNew.length === batchSize) {
          log(`${i} => ${batchSize} ops new => ${moment().format()}`)
          await DataSetRow.insertMany(bulkOpsNew)
          bulkOpsNew = []
          i++
        }
      }

      if (bulkOpsEdit.length > 0) {
        await DataSetRow.bulkWrite(bulkOpsEdit)
      }

      if (bulkOpsNew.length > 0) {
        await DataSetRow.insertMany(bulkOpsNew)
      }

      log('Obtaining max and min dates ...')

      let maxDate = moment.utc(dataset.dateMax, 'YYYY-MM-DD')
      let minDate = moment.utc(dataset.dateMin, 'YYYY-MM-DD')

      if (moment.utc(project.mainDataset.dateMin, 'YYYY-MM-DD').isBefore(minDate)) {
        minDate = moment.utc(project.mainDataset.dateMin, 'YYYY-MM-DD')
      }

      if (moment.utc(project.mainDataset.dateMax, 'YYYY-MM-DD').isAfter(maxDate)) {
        maxDate = moment.utc(project.mainDataset.dateMax, 'YYYY-MM-DD')
      }

      newDataset.set({
        dateMax: maxDate.format('YYYY-MM-DD'),
        dateMin: minDate.format('YYYY-MM-DD'),
        status: 'ready'
      })
      dataset.set({
        status: 'conciliated'
      })

      await newDataset.save()
      await dataset.save()

      project.mainDataset.set({
        isMain: false,
        status: 'conciliated'
      })
      await project.mainDataset.save()

      project.set({
        mainDataset: newDataset,
        status: 'pendingRows',
        dateMax: maxDate,
        dateMin: minDate
      })

      project.save()

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
      channel: 'opskamino',
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

    sendSlackNotificacion.run({
      channel: 'opskamino',
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
