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

  if (!argv.dateStart || !argv.dateEnd) {
    throw new Error('You need to provide a start and end date!')
  }

  let dateStart = moment.utc(argv.dateStart, 'YYYY-MM-DD')
  let dateEnd = moment.utc(argv.dateEnd, 'YYYY-MM-DD')

  if (argv.batchSize) {
    try {
      batchSize = parseInt(argv.batchSize)
    } catch (e) {
      console.log('Invalid batch size! Using default of 1000 ...')
    }
  }

  let i = 0
  console.log('Fetching Project...')
  console.log(`Using batch size of ${batchSize}`)
  console.log(`Start ==>  ${moment().format()}`)

  const project = await Project.findOne({uuid: argv.project})

  const dataset = await DataSet.findOne({uuid: argv.dataset})

  if (!project || !dataset) {
    throw new Error('Invalid project or dataset!')
  }

  if (!project.mainDataset) {
    console.log("Error! There's no main dataset to filter from!")
    console.log(`End ==> ${moment().format()}`)

    dataset.set({
      status: 'error',
      error: "Error! There's no main dataset to filter from!"
    })
    await dataset.save()

    return true
  }

  console.log('Obtaining rows to copy ...')

  try {
    const rows = await DataSetRow.find({
      dataset: project.mainDataset,
      forecastDate: { $gte: dateStart, $lte: dateEnd }
    }).cursor({batchSize: batchSize * 10})

    console.log('rows ready, transversing ...')

    var bulkOpsNew = []
    for (let row = await rows.next(); row != null; row = await rows.next()) {
      bulkOpsNew.push(
        {
          ...row,
          _id: undefined,
          'organization': project.organization,
          'project': project,
          'dataset': dataset._id
        }
      )

      if (bulkOpsNew.length === batchSize) {
        console.log(`${i} => ${batchSize} ops new => ${moment().format()}`)
        await DataSetRow.insertMany(bulkOpsNew)
        bulkOpsNew = []
        i++
      }
    }

    if (bulkOpsNew.length > 0) {
      await DataSetRow.insertMany(bulkOpsNew)
    }

    console.log('Obtaining max and min dates ...')

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

    console.log(`Successfully generated dataset ${dataset.name} for adjustment`)
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
