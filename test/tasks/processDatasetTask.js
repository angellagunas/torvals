/* global describe, beforeEach, it */
require('co-mocha')

const { assert, expect } = require('chai')
const {
  Channel,
  Product,
  SalesCenter,
  DataSetRow,
  Rule,
  Catalog,
  CatalogItem } = require('models')

const {
  clearDatabase,
  createCycles,
  createUser,
  createDataset,
  createOrganization,
  createProject,
  createFileChunk,
  createFullOrganization,
  createDatasetRows } = require('../utils')

const processDataset = require('tasks/dataset/process/process-dataset')
const generatePeriods = require('tasks/organization/generate-periods')
const saveDatasetrows = require('tasks/dataset/process/save-datasetrows')

describe('Process datasets', () => {
  beforeEach(async function () {
    await clearDatabase()
  })

  describe('with csv file with 3 products', () => {
    it('should process dataset successfully', async function () {
      const user = await createUser()
      const org = await createFullOrganization({
        period: 'M'
      })
      const rule = await Rule.findOne({organization: org._id})

      const project = await createProject({
        organization: org._id,
        createdBy: user._id
      })

      const dataset = await createDataset({
        organization: org._id,
        createdBy: user._id,
        project: project._id,
        rule: rule._id
      })

      const chunk = await createFileChunk()

      dataset.set({
        fileChunk: chunk,
        status: 'uploading',
        uploadedBy: user._id
      })

      await dataset.save()

      datarows = await createDatasetRows({
        organization: org._id,
        project: project._id,
        dataset: dataset._id
      })

      processingResult = await processDataset.run({uuid: dataset.uuid})

      let canal_catalog = await Catalog.findOne({slug: 'canal'})
      let sale_center_catalog = await Catalog.findOne({slug: 'centro-de-venta'})
      let product_catalog = await Catalog.findOne({slug: 'producto'})

      channels = await CatalogItem.find({catalog: canal_catalog._id}).count()
      saleCenters = await CatalogItem.find({catalog: sale_center_catalog._id}).count()
      products = await CatalogItem.find({catalog: product_catalog._id}).count()

      detalleChannel = await CatalogItem.findOne({catalog: canal_catalog, externalId: 1})
      autoServicioChannel = await CatalogItem.findOne({catalog: canal_catalog, externalId: 2})
      convenienciaChannel = await CatalogItem.findOne({catalog: canal_catalog, externalId: 4})

      product1 = await CatalogItem.findOne({catalog:product_catalog, externalId: '123109', name: 'Takis Fuego 62G Co2 Bar'})
      product2 = await CatalogItem.findOne({catalog:product_catalog, externalId: '123110', name: 'Runners 58G Co2 Bar'})
      product3 = await CatalogItem.findOne({catalog:product_catalog, externalId: '122928', name: 'Pecositas 70P 9 8G Ric'})

      saleCenter1 = await CatalogItem.findOne({catalog:sale_center_catalog, externalId: '12604', name: 'Not identified'})
      saleCenter2 = await CatalogItem.findOne({catalog:sale_center_catalog, externalId: '12837', name: 'Not identified'})

      expect(channels).equal(3)
      expect(products).equal(3)
      expect(saleCenters).equal(2)

      assert.exists(detalleChannel)
      assert.exists(autoServicioChannel)
      assert.exists(convenienciaChannel)

      expect(detalleChannel.name).equal('detalle')
      expect(autoServicioChannel.name).equal('autoservicio')
      expect(convenienciaChannel.name).equal('conveniencia')

      assert.exists(product1)
      assert.exists(product2)
      assert.exists(product3)

      assert.exists(saleCenter1)
      assert.exists(saleCenter2)
    })

    it('should add period on each row', async function () {
      const user = await createUser()
      const org = await createFullOrganization({
        period: 'M'
      })
      const rule = await Rule.findOne({organization: org._id})

      const project = await createProject({
        organization: org._id,
        createdBy: user._id
      })

      const dataset = await createDataset({
        organization: org._id,
        createdBy: user._id,
        project: project._id,
        rule: rule._id
      })

      const chunk = await createFileChunk()

      dataset.set({
        fileChunk: chunk,
        status: 'uploading',
        uploadedBy: user._id
      })

      await dataset.save()

      datarows = await createDatasetRows({
        organization: org._id,
        project: project._id,
        dataset: dataset._id
      })

      processingResult = await processDataset.run({uuid: dataset.uuid})
      savingDatasetRows = await saveDatasetrows.run({uuid: dataset.uuid})

      const rows = await DataSetRow.find({dataset: dataset._id})

      for (row of rows) {
        assert.exists(row.cycle)
        assert.exists(row.period)
      }
    })
  })
})
