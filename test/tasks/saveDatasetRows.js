/* global describe, beforeEach, it */
require('co-mocha')

const { assert, expect } = require('chai')
const { Channel, Product, SalesCenter, DataSetRow, CatalogItem } = require('models')
const {
  clearDatabase,
  createCycles,
  createUser,
  createDataset,
  createOrganization,
  createProject,
  createFileChunk,
  createDatasetRows
} = require('../utils')

const processDataset = require('tasks/dataset/process/process-dataset')
const generatePeriods = require('tasks/organization/generate-periods')
const saveDatasetrows = require('tasks/dataset/process/save-datasetrows')

describe('Save datasets rows', () => {
  beforeEach(async function () {
    await clearDatabase()
  })

  describe('with csv file with 3 products', () => {
    it('should add catalogItems on each row', async function () {
      const user = await createUser()
      const token = await user.createToken({type: 'session'})
      const jwt = token.getJwt()

      const org = await createOrganization({rules: {
        startDate: '2018-01-01T00:00:00',
        cycleDuration: 1,
        cycle: 'M',
        period: 'M',
        periodDuration: 1,
        season: 12,
        cyclesAvailable:6,
        catalogs: [
          "producto"
        ],
        ranges: [0, 0, 0, 0, 0, 0],
        takeStart: true,
        consolidation: 26,
        forecastCreation: 1,
        rangeAdjustment: 1,
        rangeAdjustmentRequest: 1,
        salesUpload : 1
      }})

      await createCycles({organization: org._id})
      await generatePeriods.run({uuid: org.uuid})

      const project = await createProject({
        organization: org._id,
        createdBy: user._id
      })

      const dataset = await createDataset({
        organization: org._id,
        createdBy: user._id,
        project: project._id
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

      for(row of rows){
        assert.exists(row.catalogItems)
        expect(row.catalogItems.length).to.be.greaterThan(0);
      }
    })
  })
})
