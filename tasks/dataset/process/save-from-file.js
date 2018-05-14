// node tasks/migrations/set-week-datasetrows.js
require('../../../config')
require('lib/databases/mongo')
const moment = require('moment')
const { execSync } = require('child_process')

const Task = require('lib/task')
const { Project, DataSet, DataSetRow } = require('models')

const task = new Task(async function (argv) {
  var batchSize = 10000
  if (!argv.file) {
    throw new Error('You need to provide a file!')
  }

  if (!argv.project) {
    throw new Error('You need to provide a project!')
  }

  if (argv.batchSize) {
    try {
      batchSize = parseInt(argv.batchSize)
    } catch (e) {
      console.log('Invalid batch size! Using default of 1000 ...')
    }
  }

  console.log('Fetching Dataset...')

  const project = await Project.findOne({uuid: argv.project})

  if (!project) {
    throw new Error('Invalid project!')
  }

  const dataset = await DataSet.create({
    name: 'prueba cargar dataset',
    project: project._id,
    createdBy: project.createdBy,
    organization: project.organization
  })

  var bulkOps = []

  const filepath = argv.file

  const rawLineCount = execSync(`wc -l < ${filepath}`)
  const lineCount = parseInt(String(rawLineCount)) - 1
  const pages = Math.ceil(lineCount / batchSize)

  console.log('Reading =>', pages * 100, 'from', filepath)

  var headers = String(execSync(`sed -n '1p' ${filepath}`))
  headers = headers.split('\n')[0].split(',')

  var dateColumn = {name: 'fecha'}

  for (var i = 0; i < pages; i++) {
    console.log(`${lineCount} => ${(i * batchSize) + 1} - ${(i * batchSize) + batchSize}`)

    var rawLine

    if (i === 0) {
      rawLine = String(execSync(`sed '1d;${(i * batchSize) + batchSize}q' ${filepath}`))
    } else {
      rawLine = String(execSync(`sed '1,${i * batchSize}d;${(i * batchSize) + batchSize}q' ${filepath}`))
    }

    // if (i === 0) {
    //   rawLine = String(execSync(`tail -n +1 ${filepath} | head -n ${1000}`))
    // } else {
    //   rawLine = String(execSync(`tail -n +${i * 1000} ${filepath} | head -n ${1000}`))
    // }

    let rows = rawLine.split('\n')

    for (let row of rows) {
      let obj = {}
      let itemSplit = row.split(',')

      for (var j = 0; j < headers.length; j++) {
        obj[headers[j]] = itemSplit[j]
      }

      if (!obj[dateColumn.name]) {
        continue
      }

      let forecastDate

      try {
        forecastDate = moment.utc(obj[dateColumn.name], 'YYYY-MM-DD')
      } catch (e) {
        continue
      }

      if (!forecastDate.isValid()) {
        continue
      }

      bulkOps.push({
        'organization': dataset.organization,
        'project': dataset.project,
        'dataset': dataset._id,
        'apiData': obj
      })
    }

    await DataSetRow.insertMany(bulkOps)
    console.log(`${batchSize} ops ==> ${moment().format()}`)
    bulkOps = []
  }

  console.log(`Saved in dataset ${dataset.uuid}`)

  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
