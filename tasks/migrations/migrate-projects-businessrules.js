// node tasks/migrations/migrate-projects-businessrules.js
require('../../config')
require('lib/databases/mongo')
const moment = require('moment')
const _ = require('lodash')
const generateCycles = require('tasks/organization/generate-cycles')

const Task = require('lib/task')
const { Rule, Project, DataSet, CatalogItem, DataSetRow, Cycle, Period } = require('models')

const task = new Task(async function (argv) {
  console.log(`Start ==>  ${moment().format()}`)
  console.log('Fetching Projects...')
  const projects = await Project.find({}).populate('organization rule mainDataset')

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
    catalogs: [
      {
        name: 'Producto',
        slug: 'producto'
      }, {
        name: 'Centro de venta',
        slug: 'centro-de-venta'
      }, {
        name: 'Canal',
        slug: 'canal'
      }
    ],
    ranges: [0, 0, 10, 20, 30, null]
  }

  for (let project of projects) {
    let catalogItems = await CatalogItem.find({organization: project.organization})

    console.log('Fetching Rules...')

    let currentRule = await Rule.findOne({
      organization: project.organization._id,
      isCurrent: true
    })
    if (!currentRule) {
      console.log('Rules not found. Creating...')
      currentRule = await Rule.create({
        ...rules,
        organization: project.organization._id,
        isCurrent: true
      })
      console.log('Generating cycles and periods...')
      await generateCycles.run({uuid: project.organization.uuid, rule: currentRule.uuid})
    }
    project.organization.set({
      rule: currentRule._id
    })
    await project.organization.save()

    project.set({
      rule: currentRule._id
    })
    await project.save()

    if (!project.mainDataset) { continue }

    console.log('Retrieving dataset...', project.mainDataset.uuid)
    let datasets = await DataSet.find({_id: project.mainDataset._id}).populate('channels salesCenters products')
    for (let dataset of datasets) {
      console.log('Searching Dataset cycles and periods...')
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

      console.log('Saving channels catalogs')
      let existingCatalogs = []
      let bulkOps = new Set()

      for (let channel of dataset.channels) {
        let findChannel = _.find(catalogItems, ['externalId', channel.externalId])
        if (!findChannel) {
          bulkOps.add({
            type: 'canal',
            name: channel.name,
            externalId: channel.externalId,
            organization: project.organization._id,
            groups: channel.groups
          })
        } else {
          existingCatalogs.push(findChannel._id)
        }
      }

      console.log('Saving sales centers catalogs')
      for (let salesCenter of dataset.salesCenters) {
        let findSalesCenter = _.find(catalogItems, ['externalId', salesCenter.externalId])
        if (!findSalesCenter) {
          bulkOps.add({
            type: 'centro-de-venta',
            name: salesCenter.name,
            externalId: salesCenter.externalId,
            organization: project.organization._id,
            groups: salesCenter.groups
          })
        } else {
          existingCatalogs.push(findSalesCenter._id)
        }
      }

      console.log('Saving products catalog')
      for (let product of dataset.products) {
        let findProduct = _.find(catalogItems, ['externalId', product.externalId])
        if (!findProduct) {
          bulkOps.add({
            type: 'producto',
            name: product.name,
            externalId: product.externalId,
            organization: project.organization._id
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

      console.log('Saving DataSetRow periods')
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

      let datasetRows = await DataSetRow.find({dataset: dataset._id}).populate('channel product salesCenter').cursor()
      console.log('Saving DataSetRow catalogs')
      for (let datasetRow = await datasetRows.next(); datasetRow != null; datasetRow = await datasetRows.next()) {
        let channelCatalog = _.find(dataset.catalogItems,
          {
            externalId: datasetRow.channel.externalId,
            type: 'canal'
          }
        )
        let salesCatalog = _.find(dataset.catalogItems,
          {
            externalId: datasetRow.salesCenter.externalId,
            type: 'centro-de-venta'
          }
        )
        let productCatalog = _.find(dataset.catalogItems,
          {
            externalId: datasetRow.product.externalId,
            type: 'producto'
          }
        )

        datasetRow.set({
          catalogData: {
            is_producto_name: datasetRow.product.name,
            is_producto_id: datasetRow.product.externalId,
            is_canal_name: datasetRow.channel.name,
            is_canal_id: datasetRow.channel.externalId,
            'is_centro-de-venta_name': datasetRow.salesCenter.name,
            'is_centro-de-venta_externalId': datasetRow.salesCenter.externalId
          },
          catalogItems: [
            channelCatalog._id,
            salesCatalog._id,
            productCatalog._id
          ]
        })
        await datasetRow.save()
      }
      console.log('Saving status as pendingRows')
      project.set({
        status: 'pendingRows'
      })
      await project.save()
    }
  }

  console.log(`End ==>  ${moment().format()}`)

  return true
})

if (require.main === module) {
  task.setCliHandlers()
  task.run()
} else {
  module.exports = task
}
