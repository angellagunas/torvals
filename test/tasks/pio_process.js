/* global describe, beforeEach, it */
require('co-mocha')

const moment = require('moment')

const { assert, expect } = require('chai')
const { Channel, Project, DataSetRow, DataSet, Rule, ForecastGroup, Forecast, Engine } = require('models')
const {
  clearDatabase,
  createUser,
  createDataset,
  createProject,
  createFileChunk,
  createDatasetRows,
  createFullOrganization
} = require('../utils')

const saveDatasetrows = require('tasks/dataset/process/save-datasetrows')
const processDataset = require('tasks/dataset/process/process-dataset')
const conciliateDataset = require('tasks/project/conciliate-to-project')
const createPioProcess = require('tasks/pio/create')


describe.skip('Pio process', () => {

    it('should be success', async function () {
      await clearDatabase()

      const user = await createUser()
      const org = await createFullOrganization({
        period: 'M'
      })

      const rule = await Rule.findOne({organization: org._id})

      const project = await createProject({
        organization: org._id,
        createdBy: user._id,
        rule: rule._id
      })

      const dataset = await createDataset({
        organization: org._id,
        createdBy: user._id,
        project: project._id,
        isMain: true,
        rule: rule._id
      })

      project.set({
        mainDataset: dataset._id,
        status: 'ready'
      })

      await project.save()

      const chunk = await createFileChunk()

      dataset.set({
        fileChunk: chunk,
        status: 'ready',
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

      conciliateResult = await conciliateDataset.run({
        dataset: dataset.uuid,
        project: project.uuid
      })

      const projectConciliate = await Project.findOne({_id:project._id}).populate('mainDataset')
      const totalDatasets = await DataSet.find({}).count()
      const totalNewDatasetRows = await DataSetRow.find({dataset: projectConciliate.mainDataset._id}).count()

      const data = {
        project: project._id,
        forecasts: [],
        type: 'informative',
        alias: 'a_forecast_test',
        createdBy: user._id
      }

      const forecastGroup = await ForecastGroup.create(data)

      const engine = await Engine.create({
        name: 'regression',
        descrition: 'a models with perfect prediction',
        path: 'http://predictionio.orax.io',
        instructions: '1.- some instructions'
      })

      const forecast = await Forecast.create({
        approvedBy: user._id,
        catalogs: [],
        dataset: dataset._id,
        engine: engine._id,
        forecastGroup: forecastGroup._id,
        dateEnd: moment.utc(),
        dateStart: moment.utc(),
        instanceKey: 'a_random_intance_key',
        port: 1000,
        status: 'created',
        uuid: 'a_static_uuid',
        project: project._id
      })

      forecastGroup.forecasts.push(forecast._id)
      await forecastGroup.save()

      await createPioProcess.run({uuid: forecast.uuid})

      expect(dataset._id).to.not.equal(projectConciliate.mainDataset._id)
      expect(totalDatasets).equal(1)
      expect(totalNewDatasetRows).equal(12)
    })
})
