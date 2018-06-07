// node tasks/dataset/process/conciliate-dataset.js --dataset1 uuid --dataset2 uuid [--batchSize batchSize]
require('../../../config')
require('lib/databases/mongo')
const moment = require('moment')

const Task = require('lib/task')
const { DataSet, DataSetRow } = require('models')

const task = new Task(
  async function (argv) {
    let log = (args) => {
      args = ('[conciliate-dataset] ') + args

      console.log(args)
    }

    var batchSize = 10000
    if (!argv.dataset1) {
      throw new Error('You need to provide two datasets!')
    }

    if (!argv.dataset2) {
      throw new Error('You need to provide two datasets!')
    }

    if (argv.batchSize) {
      try {
        batchSize = parseInt(argv.batchSize)
      } catch (e) {
        console.log('Invalid batch size! Using default of 1000 ...')
      }
    }

    let i = 0
    log('Fetching Datasets ...')
    log(`Using batch size of ${batchSize}`)
    log(`Start ==>  ${moment().format()}`)

    const dataset1 = await DataSet.findOne({uuid: argv.dataset1}).populate('project')
    const dataset2 = await DataSet.findOne({uuid: argv.dataset2})

    if (!dataset1 || !dataset2) {
      throw new Error('Invalid dataset!')
    }

    let match = {
      '$match': {
        dataset: {$in: [dataset1._id, dataset2._id]}
      }
    }

    log([dataset1._id, dataset2._id])

    const key = {
      date: '$data.forecastDate',
      product: '$product',
      salesCenter: '$salesCenter',
      channel: '$channel',
      period: '$period'
    }

    match = [
      match,
      {
        '$group': {
          _id: key,
          mergedRows: { $mergeObjects: '$$ROOT' }
          // rows: { $push: '$$ROOT' }
        }
      },
      { '$replaceRoot': { newRoot: '$mergedRows' } }
    ]

    log('Obtaining aggregate ...')

    try {
      const rows = await DataSetRow.aggregate(match).allowDiskUse(true)
        .cursor({batchSize: batchSize * 10}).exec()

      log('Aggregate ready, transversing ...')

      let newDataset = await DataSet.create({
        name: 'Main Dataset',
        project: dataset1.project,
        organization: dataset1.project.organization,
        createdBy: dataset2.createdBy,
        uploadedBy: dataset2.uploadedBy,
        conciliatedBy: dataset2.conciliatedBy,
        dateMax: dataset1.dateMax,
        dateMin: dataset1.dateMin,
        columns: dataset1.columns,
        salesCenters: dataset1.salesCenters,
        products: dataset1.products,
        channels: dataset1.channels,
        isMain: true,
        groupings: dataset1.groupings,
        apiData: dataset1.apiData,
        source: 'conciliation',
        status: 'conciliating',
        rule: dataset1.rule
      })

      var bulkOpsNew = []
      for (let row = await rows.next(); row != null; row = await rows.next()) {
        if (row.status === 'adjusted') {
          row.data.lastAdjustment = row.data.adjustment
        }

        delete row.adjustmentRequest
        delete row.isAnomaly
        delete row.isDeleted
        delete row.uuid
        delete row.status
        delete row.dateCreated

        bulkOpsNew.push(
          {
            ...row,
            _id: undefined,
            'organization': dataset1.project.organization,
            'project': dataset1.project,
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

      if (bulkOpsNew.length > 0) {
        await DataSetRow.insertMany(bulkOpsNew)
      }

      log('Obtaining max and min dates ...')

      let maxDate = moment.utc(dataset2.dateMax, 'YYYY-MM-DD')
      let minDate = moment.utc(dataset2.dateMin, 'YYYY-MM-DD')

      if (moment.utc(dataset1.dateMin, 'YYYY-MM-DD').isBefore(minDate)) {
        minDate = moment.utc(dataset1.dateMin, 'YYYY-MM-DD')
      }

      if (moment.utc(dataset1.dateMax, 'YYYY-MM-DD').isAfter(maxDate)) {
        maxDate = moment.utc(dataset1.dateMax, 'YYYY-MM-DD')
      }

      newDataset.set({
        dateMax: maxDate.format('YYYY-MM-DD'),
        dateMin: minDate.format('YYYY-MM-DD'),
        status: 'ready'
      })

      dataset2.set({
        status: 'conciliated'
      })

      await dataset2.save()
      await newDataset.save()

      dataset1.set({
        status: 'ready'
      })
      await dataset1.save()

      log(`Successfully conciliated datasets ${dataset1.name} & ${dataset2.name}`)

      log(`End ==> ${moment().format()}`)

      return newDataset.uuid
    } catch (e) {
      console.log(e)
      dataset2.set({
        status: 'error',
        error: e.message
      })

      await dataset2.save()

      return false
    }
  }
)

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
