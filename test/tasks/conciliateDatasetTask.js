/* global describe, beforeEach, it */
require('co-mocha')

const moment = require('moment')

const { assert, expect } = require('chai')
const { Channel, Project, DataSetRow, DataSet } = require('models')
const {
  clearDatabase,
  createUser,
  createDataset,
  createOrganization,
  createProject,
  createFileChunk,
  createDatasetRows,
  createChannels,
  createProducts,
  createSaleCenters,
  createDatasetRowsUnConciliate
} = require('../utils')

const conciliateDataset = require('tasks/dataset/process/conciliate-dataset')


describe('Conciliate datasets', () => {
  beforeEach(async function () {
    await clearDatabase()
  })

  describe('with csv file with 3 products', () => {
    it('should conciliate dataset successfully', async function () {
      this.timeout(1000 * 30);
      const user = await createUser()
      const token = await user.createToken({type: 'session'})
      const jwt = token.getJwt()

      const org = await createOrganization()

      const project = await createProject({
        organization: org._id,
        createdBy: user._id
      })

      const dataset = await createDataset({
        organization: org._id,
        createdBy: user._id,
        project: project._id,
        isMain: true
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
      const channels = await createChannels({organization: org._id})
      const products = await createProducts({organization: org._id})
      const saleCenters = await createSaleCenters({organization: org._id})

      /*
       * Now create the dataset to conciliate
       */
      const datasetToConciliate = await createDataset({
        organization: org._id,
        createdBy: user._id,
        project: project._id,
        dateMax: "2018-05-16",
        dateMin: "2017-10-04"
      })

      await createDatasetRowsUnConciliate({
        organization: org._id,
        project: project._id,
        dataset: datasetToConciliate._id
      })

      let wasFailed = false
      try{
        conciliateResult = await conciliateDataset.run({
          dataset: datasetToConciliate.uuid,
          project: project.uuid
        })
      }catch(error){
        wasFailed = true
      }

      const projectConciliate = await Project.findOne({_id:project._id}).populate('mainDataset')
      const totalDatasets = await DataSet.find({}).count()
      const totalNewDatasetRows = await DataSetRow.find({dataset: projectConciliate.mainDataset._id}).count()

      expect(wasFailed).equal(false)
      expect(datasetToConciliate._id).to.not.equal(projectConciliate.mainDataset._id)
      expect(dataset._id).to.not.equal(projectConciliate.mainDataset._id)
      expect(totalDatasets).equal(3)
      expect(totalNewDatasetRows).equal(13)
    })
  })
})
