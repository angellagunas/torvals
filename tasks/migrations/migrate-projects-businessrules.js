// node tasks/migrations/migrate-projects-businessrules.js --uuid <project_uuid>
require('../../config')
require('lib/databases/mongo')
const moment = require('moment')
const _ = require('lodash')

const generateCycles = require('tasks/organization/generate-cycles')
const getAnomalies = require('tasks/anomalies/get-anomalies')
const Logger = require('lib/utils/logger')
const Task = require('lib/task')
const {
  Rule,
  Project,
  DataSet,
  Catalog,
  CatalogItem,
  DataSetRow,
  Cycle,
  Period,
  Anomaly,
  Product
} = require('models')

const task = new Task(async function (argv) {
  const log = new Logger('migrate-projects-businessrules')
  log.call(`Start ==>  ${moment().format()}`)
  if (!argv.uuid) {
    throw new Error('Project uuid not defined')
  }

  log.call(`Fetching Project => ${argv.uuid}`)
  const project = await Project.findOne({ uuid: argv.uuid })
    .populate('organization rule mainDataset')
  if (!project.mainDataset) {
    throw new Error('mainDataset not found')
  }

  log.call('Verifying catalogs...')
  let currentCatalogs = await Catalog.find({
    organization: project.organization._id,
    isDeleted: false
  })

  if (!currentCatalogs || currentCatalogs.length === 0) {
    currentCatalogs = []
    log.call('Catalogs not found. Creating...')
    let catalogs = [{
      name: 'Producto',
      slug: 'producto'
    }, {
      name: 'Centro de venta',
      slug: 'centro-de-venta'
    }, {
      name: 'Canal',
      slug: 'canal'
    }]
    for (let catalog of catalogs) {
      let newCatalog = await Catalog.create({
        organization: project.organization._id,
        name: catalog.name,
        slug: catalog.slug,
        isDeleted: false
      })
      currentCatalogs.push(newCatalog)
    }
  }

  let rules = {
    startDate: moment().startOf('year').utc().format('YYYY-MM-DD'),
    cycleDuration: 1,
    cycle: 'M',
    period: 'w',
    periodDuration: 1,
    season: 12,
    cyclesAvailable: 6,
    takeStart: true,
    consolidation: 8,
    forecastCreation: 3,
    rangeAdjustmentRequest: 6,
    rangeAdjustment: 10,
    salesUpload: 3,
    catalogs: currentCatalogs,
    ranges: [0, 0, 10, 20, 30, null],
    version: 1
  }

  log.call('Verifying catalog items...')
  let catalogItems = await CatalogItem.find({
    organization: project.organization
  })

  for (let catalogItem of catalogItems.filter((item) => { return item.type !== undefined })) {
    catalogItem.set({
      catalog: currentCatalogs.find((catalog) => {
        return catalog.slug === catalogItem.type
      })
    })
    await catalogItem.save()
  }

  log.call('Fetching Rules...')

  let currentRule = await Rule.findOne({
    organization: project.organization._id,
    isCurrent: true
  })
  if (!currentRule) {
    log.call('Rules not found. Creating...')
    currentRule = await Rule.create({
      ...rules,
      organization: project.organization._id,
      isCurrent: true
    })
    log.call('Generating cycles and periods...')
    await generateCycles.run({
      uuid: project.organization.uuid,
      rule: currentRule.uuid
    })
  }
  project.organization.set({
    rule: currentRule._id
  })
  await project.organization.save()

  project.set({
    rule: currentRule._id
  })
  await project.save()

  log.call(`Retrieving dataset... ${project.mainDataset.uuid}`)
  let datasets = await DataSet.find({_id: project.mainDataset._id}).populate('channels salesCenters products')
  for (let dataset of datasets) {
    log.call('Searching Dataset cycles and periods...')
    let cycles = await Cycle.getBetweenDates(
        project.organization._id,
        currentRule._id,
        moment(dataset.dateMin).utc().format('YYYY-MM-DD'),
        moment(dataset.dateMax).utc().format('YYYY-MM-DD')
      )

    cycles = cycles.map(item => {
      return item._id
    })

    let periods = await Period.getBetweenDates(
        project.organization._id,
        currentRule._id,
        moment(dataset.dateMin).utc().format('YYYY-MM-DD'),
        moment(dataset.dateMax).utc().format('YYYY-MM-DD')
      )

    periods = periods.map(item => {
      return item._id
    })

    log.call('Saving channels catalogs')
    let existingCatalogs = []
    let bulkOps = new Set()

    for (let channel of dataset.channels) {
      let findChannel = _.find(catalogItems, ['externalId', channel.externalId])
      if (!findChannel) {
        bulkOps.add({
          catalog: currentCatalogs.find((catalog) => {
            return catalog.slug === 'canal'
          }),
          name: channel.name,
          externalId: channel.externalId,
          organization: project.organization._id,
          groups: channel.groups,
          type: 'canal'
        })
      } else {
        existingCatalogs.push(findChannel._id)
      }
    }

    log.call('Saving sales centers catalogs')
    for (let salesCenter of dataset.salesCenters) {
      let findSalesCenter = _.find(catalogItems, ['externalId', salesCenter.externalId])
      if (!findSalesCenter) {
        bulkOps.add({
          catalog: currentCatalogs.find((catalog) => {
            return catalog.slug === 'centro-de-venta'
          }),
          name: salesCenter.name,
          externalId: salesCenter.externalId,
          organization: project.organization._id,
          groups: salesCenter.groups,
          type: 'centro-de-venta'
        })
      } else {
        existingCatalogs.push(findSalesCenter._id)
      }
    }

    log.call('Saving products catalog')
    for (let product of dataset.products) {
      let findProduct = _.find(catalogItems, ['externalId', product.externalId])
      if (!findProduct) {
        bulkOps.add({
          catalog: currentCatalogs.find((catalog) => {
            return catalog.slug === 'producto'
          }),
          name: product.name,
          externalId: product.externalId,
          organization: project.organization._id,
          type: 'producto'
        })
      } else {
        existingCatalogs.push(findProduct._id)
      }
    }

    bulkOps = Array.from(bulkOps)

    let catalogItemIds = await CatalogItem.insertMany(bulkOps)
    bulkOps = []

    catalogItemIds = [...catalogItemIds, ...existingCatalogs]

    dataset.set({
      catalogItems: catalogItemIds,
      rule: currentRule,
      cycles: cycles,
      periods: periods
    })

    await dataset.save()
    await dataset.populate('catalogItems periods').execPopulate()
    let newProducts = []

    for (let item of dataset.catalogItems) {
      if (item.type === 'producto') newProducts.push(item)
      await item.populate('catalog').execPopulate()
    }

    dataset.set({newProducts: newProducts})
    await dataset.save()

    log.call('Saving DataSetRow periods...')
    for (let period of dataset.periods) {
      await DataSetRow.update({
        dataset: dataset._id,
        'data.forecastDate': {
          $gte: moment(period.dateStart).utc().format('YYYY-MM-DD'),
          $lte: moment(period.dateEnd).utc().format('YYYY-MM-DD')
        }
      }, {
        period: period._id,
        cycle: period.cycle
      }, {
        multi: true
      })
    }

    var channelExternalId = dataset.getChannelColumn() || {name: ''}
    var salesCenterExternalId = dataset.getSalesCenterColumn() || {name: ''}
    var productExternalId = dataset.getProductColumn() || {name: ''}

    log.call('Saving DataSetRow catalogs')
    for (let catalogItem of dataset.catalogItems) {
      if (catalogItem.catalog.slug === 'canal') {
        await DataSetRow.update({
          dataset: dataset._id,
          [`apiData.${channelExternalId.name}`]: catalogItem.externalId,
          catalogItems: {$nin: [catalogItem._id]}
        }, {
          'catalogData.is_canal_name': catalogItem.name,
          'catalogData.is_canal_id': catalogItem.externalId,
          $push: {
            catalogItems: catalogItem._id
          }
        }, {
          multi: true
        })
      } else if (catalogItem.catalog.slug === 'centro-de-venta') {
        await DataSetRow.update({
          dataset: dataset._id,
          [`apiData.${salesCenterExternalId.name}`]: catalogItem.externalId,
          catalogItems: {$nin: [catalogItem._id]}
        }, {
          'catalogData.is_centro-de-venta_name': catalogItem.name,
          'catalogData.is_centro-de-venta_id': catalogItem.externalId,
          $push: {
            catalogItems: catalogItem._id
          }
        }, {
          multi: true
        })
      } else if (catalogItem.catalog.slug === 'producto') {
        await DataSetRow.update({
          dataset: dataset._id,
          [`apiData.${productExternalId.name}`]: catalogItem.externalId
        }, {
          'catalogData.is_producto_name': catalogItem.name,
          'catalogData.is_producto_id': catalogItem.externalId,
          'newProduct': catalogItem._id
        }, {
          multi: true
        })
      }
    }

    let products = await Product.find({})
    let prodsObj = {}

    for (let prod of products) {
      prodsObj[prod._id] = prod
    }

    let datasetRows = await DataSetRow.find({
      dataset: dataset._id,
      newProduct: { $exists: false }
    }).cursor()

    for (let row = await datasetRows.next(); row != null; row = await datasetRows.next()) {
      let prod = prodsObj[row.product]
      let findProduct = _.find(newProducts, ['externalId', prod.externalId])
      if (!findProduct) {
        findProduct = await CatalogItem.create({
          catalog: currentCatalogs.find((catalog) => {
            return catalog.slug === 'producto'
          }),
          name: prod.name,
          externalId: prod.externalId,
          organization: project.organization._id,
          type: 'producto'
        })
      } else {
        newProducts.push(findProduct._id)
      }

      row.set({
        'catalogData.is_producto_name': findProduct.name,
        'catalogData.is_producto_id': findProduct.externalId,
        'newProduct': findProduct._id
      })

      await row.save()
    }

    dataset.set({newProducts: newProducts})
    await dataset.save()

    await Anomaly.deleteMany({project: project._id})
    await getAnomalies.run({uuid: argv.uuid})

    log.call('Saving status as pendingRows')
    project.set({
      status: 'pendingRows'
    })
    await project.save()
  }

  log.call(`End ==>  ${moment().format()}`)

  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
