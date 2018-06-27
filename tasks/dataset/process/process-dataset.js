// node tasks/dataset/process/process-dataset.js --uuid uuid [--batchSize batchSize --noNextStep]
require('../../../config')
require('lib/databases/mongo')
const _ = require('lodash')
const fillCyclesPeriods = require('tasks/organization/fill-cycles-periods')
const Logger = require('lib/utils/logger')
const moment = require('moment')
const saveDatasetRows = require('queues/save-datasetrows')
const sendSlackNotificacion = require('tasks/slack/send-message-to-channel')
const Task = require('lib/task')
const { DataSet, DataSetRow, Cycle, Period } = require('models')

const task = new Task(
  async function (argv) {
    const log = new Logger('process-dataset')

    if (!argv.uuid) {
      throw new Error('You need to provide an uuid!')
    }

    log.call('Processing Dataset...')
    log.call(`Start ==>  ${moment().format()}`)

    const dataset = await DataSet
      .findOne({uuid: argv.uuid})
      .populate('organization rule')
    await dataset.rule.populate('catalogs').execPopulate()

    if (!dataset) {
      throw new Error('Invalid uuid!')
    }

    let maxDate
    let minDate
    let catalogsObj = {}

    for (let catalog of dataset.rule.catalogs) {
      let name = dataset.getCatalogItemColumn(`is_${catalog.slug}_name`)
      let idStr = dataset.getCatalogItemColumn(`is_${catalog.slug}_id`)

      let catalogObj = idStr && idStr.name ? {_id: `$apiData.${idStr.name}`} : {}

      if (name && name.name) {
        catalogObj['name'] = `$apiData.${name.name}`
      }

      catalogsObj[catalog.slug] = {
        '$addToSet': catalogObj
      }
    }

    var statement = [
      {
        '$match': {
          'dataset': dataset._id
        }
      }, {
        '$group': {
          '_id': null,
          ...catalogsObj
        }
      }
    ]

    log.call('Obtaining uniques ...')

    let rows = await DataSetRow.aggregate(statement)
    let rowData = {
      products: [],
      salesCenters: [],
      channels: []
    }

    for (let product of rows[0].producto) {
      let productIndex = _.findIndex(rowData['products'], { '_id': product._id })
      if (productIndex === -1) {
        rowData['products'].push(product)
      } else {
        if (!rowData['products'][productIndex].name && product.name) {
          rowData['products'][productIndex].name = product.name
        }
      }
    }

    for (let catalog of dataset.rule.catalogs) {
      // if (catalog.slug === 'producto') continue
      rowData[catalog.slug] = rows[0][catalog.slug]
    }

    log.call('Obtaining max and min dates ...')
    statement = [
      {
        '$match': {
          'dataset': dataset._id
        }
      }, {
        '$group': {
          '_id': null,
          'max': { '$max': '$data.forecastDate' },
          'min': { '$min': '$data.forecastDate' }
        }
      }
    ]

    rows = await DataSetRow.aggregate(statement)

    maxDate = moment(rows[0].max).utc().format('YYYY-MM-DD')
    minDate = moment(rows[0].min).utc().format('YYYY-MM-DD')

    await fillCyclesPeriods.run({
      uuid: dataset.organization.uuid,
      rule: dataset.rule.uuid,
      dateMin: minDate,
      dateMax: maxDate
    })

    log.call('Obtaining cycles ...')
    let cycles = await Cycle.getBetweenDates(
      dataset.organization._id,
      dataset.rule._id,
      minDate,
      maxDate
    )

    cycles = cycles.map(item => {
      return item._id
    })

    log.call('Obtaining periods...')
    let periods = await Period.getBetweenDates(
      dataset.organization._id,
      dataset.rule._id,
      minDate,
      maxDate
    )

    periods = periods.map(item => {
      return item._id
    })

    const sendData = {
      data: rowData,
      date_max: maxDate,
      date_min: minDate,
      config: {
        groupings: []
      },
      cycles: cycles,
      periods: periods
    }

    log.call('Saving new products and catalog items  ...')

    try {
      await dataset.processReady(sendData)
    } catch (e) {
      console.log(e)

      return false
    }

    log.call('Success! Dataset processed')
    log.call(`End ==>  ${moment().format()}`)

    if (!argv.noNextStep) saveDatasetRows.add({uuid: dataset.uuid})

    return true
  },
  async (argv) => {
    if (!argv.uuid) {
      throw new Error('You need to provide an uuid!')
    }
    const dataset = await DataSet.findOne({uuid: argv.uuid})
    if (!dataset) {
      throw new Error('Invalid uuid!')
    }
    sendSlackNotificacion.run({
      channel: 'all',
      message: `El dataset *${dataset.name}* ha empezado a procesarse.`
    })
  },
  async (argv) => {
    if (!argv.uuid) {
      throw new Error('You need to provide an uuid!')
    }
    const dataset = await DataSet.findOne({uuid: argv.uuid})
    if (!dataset) {
      throw new Error('Invalid uuid!')
    }
    sendSlackNotificacion.run({
      channel: 'all',
      message: `El dataset *${dataset.name}* ha terminado de procesarse.`
    })
  }
)

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
