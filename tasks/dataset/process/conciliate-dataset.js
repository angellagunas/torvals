// node tasks/migrations/set-week-datasetrows.js
require('../../../config')
require('lib/databases/mongo')
const moment = require('moment')

const Task = require('lib/task')
const { Project, DataSet, DataSetRow } = require('models')

const task = new Task(async function (argv) {
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
  console.log('Fetching Dataset and project...')
  console.log(`Using batch size of ${batchSize}`)
  console.log(`Start ==>  ${moment().format()}`)

  const project = await Project.findOne({uuid: argv.project}).populate('mainDataset')
  const dataset = await DataSet.findOne({uuid: argv.dataset})

  if (!project || !dataset) {
    throw new Error('Invalid project or dataset!')
  }

  if (!project.mainDataset) {
    project.set({
      mainDataset: dataset._id
    })
    dataset.set({
      isMain: true
    })

    await project.save()
    await dataset.save()
    console.log(`Successfully conciliated dataset ${dataset.name} into project ${project.name}`)
    console.log(`End ==> ${moment().format()}`)

    return true
  }

  let match = {
    '$match': {
      dataset: {$in: [project.mainDataset._id, dataset._id]}
    }
  }

  console.log([project.mainDataset._id, dataset._id])

  const key = {
    date: '$data.forecastDate',
    product: '$product',
    salesCenter: '$salesCenter',
    channel: '$channel',
    week: '$data.semanaBimbo'
  }

  // const key = {
  //   date: '$apiData.fecha',
  //   product: '$apiData.producto_id',
  //   salesCenter: '$apiData.agencia_id',
  //   channel: '$apiData.canal_id',
  //   week: '$apiData.semana_bimbo'
  // }

  match = [
    match,
    {
      '$group': {
        _id: key,
        mergedRows: { $mergeObjects: '$$ROOT' }
      }
    },
    { '$replaceRoot': { newRoot: '$mergedRows' } }
    // { '$project': { _id: 0, rows: 1, mergedRows: 1 } }
  ]

  console.log('Obtaining aggregate ...')

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

    console.log('Aggregate ready, transversing ...')

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
        console.log(`${i} => ${batchSize} ops new => ${moment().format()}`)
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

    console.log('Obtaining max and min dates ...')

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
      dateMin: minDate.format('YYYY-MM-DD')
    })

    await newDataset.save()

    project.set({
      mainDataset: newDataset
    })

    project.save()

    console.log(`Successfully conciliated dataset ${dataset.name} into project ${project.name}`)
  } catch (e) {
    console.log(e)
    dataset.set({
      status: 'error',
      error: e.message
    })

    await dataset.save()

    return false
  }

  console.log(`End ==> ${moment().format()}`)

  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
