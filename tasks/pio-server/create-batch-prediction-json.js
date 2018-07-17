// node tasks/pio/create-batch-prediction-json.js --forecast=uuid
require('../../config')
require('lib/databases/mongo')

const fs = require('fs')
const Logger = require('lib/utils/logger')
const moment = require('moment')
const path = require('path')
const Task = require('lib/task')
const { spawnSync } = require('child_process')
const { Catalog, CatalogItem, Forecast } = require('models')

const task = new Task(async function (argv) {
  const log = new Logger('task-pio-create-batch-json')

  log.call('Get forecast/engine data.')
  const forecast = await Forecast.findOne({ uuid: argv.forecast })
    .populate('engine')
    .populate('forecastGroup')
  if (!forecast || !forecast.engine) {
    throw new Error('Invalid forecast.')
  }
  await forecast.forecastGroup.populate('project').execPopulate()

  const catalogItems = await CatalogItem.aggregate([{
    $match: {
      isDeleted: false,
      organization: forecast.forecastGroup.project.organization,
      catalog: {
        $in: forecast.catalogs
      }
    }
  }, {
    $group: {
      _id: '$catalog',
      result: { $push: '$externalId' }
    }
  }])

  const catalogs = await Catalog.find({
    _id: { $in: forecast.catalogs },
    isDeleted: false
  })

  log.call('Creating permutations of catalog items.')
  const flatten = (arr) => [].concat.apply([], arr)
  const product = (sets) =>
    sets.reduce((acc, set) =>
      flatten(acc.map(x => set.map(y => [ ...x, y ]))),
      [[]])
  const catalogItemsData = product(catalogItems.map(item => item.result))
  const catalogItemsNames = catalogItemsData.map(item => {
    let result = {}
    for (let pos of item) {
      const catalogName = catalogs.find(catalog => catalog._id.toString() === catalogItems[item.indexOf(pos)]._id.toString())

      if (catalogName.slug === 'centro-de-venta') {
        // if (parseInt(pos) === 12604) continue
        result['agencia_id'] = parseInt(pos)
      } else {
        result[`${catalogName.slug}_id`] = parseInt(pos)
      }
    }
    return result
  })

  let dates = []
  for (let m = moment.utc(forecast.dateStart); m.diff(forecast.dateEnd, 'days') <= 0; m.add(1, 'days')) {
    dates.push(m.format('YYYY-MM-DD'))
  }

  let rows = []
  for (let date of dates) {
    for (let item of catalogItemsNames) {
      rows.push({
        'fecha': date,
        ...item
      })
    }
  }

  log.call('Create JSON')
  const tmpdir = path.resolve('.', 'media', 'jsons')
  fs.mkdir(tmpdir, (err) => {
    console.log(err)
    log.call('Folder already exists')
  })
  const filePath = path.join(tmpdir, `${forecast.uuid}.json`)
  const outputFilePath = path.join(tmpdir, `${forecast.uuid}-output.json`)
  const writerStream = fs.createWriteStream(filePath)
  for (let row of rows) {
    const json = JSON.stringify(row)
    writerStream.write(`${json}\n`)
  }

  await new Promise((resolve, reject) => {
    writerStream.end(() => { resolve() })
  })

  log.call('Send file to PIO.')
  const spawnPio = spawnSync(
    'pio',
    ['batchpredict', '--input', filePath, '--output', outputFilePath],
    { cwd: `/engines/${forecast.engine.path}` }
  )

  log.call(spawnPio.output)
  log.call(spawnPio.stdout)
  log.call(spawnPio.signal)

  log.call(spawnPio.status)
  if (spawnPio.status !== 0) {
    log.call(spawnPio.stderr)
    log.call(spawnPio.error)
    forecast.set({
      status: 'error'
    })
    await forecast.save()

    return false
  }

  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
