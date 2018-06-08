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

const conciliateDataset = require('tasks/project/conciliate-to-project')


describe('Conciliate dataset to project', () => {
  beforeEach(async function () {
    await clearDatabase()
  })

  describe('with csv file with 3 products', () => {
    it('should conciliate a new dataset with 2 records successfully', async function () {
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

    it('should conciliate this dataset as main', async function () {
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
        dateMax: "2018-05-16",
        dateMin: "2017-10-04"
      })

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
      const totalOriginalRows = await DataSetRow.find({organization: org._id}).count()

      let wasFailed = false
      let errorMsg = ''

      try{
        conciliateResult = await conciliateDataset.run({
          dataset: dataset.uuid,
          project: project.uuid
        })
      }catch(error){
        wasFailed = true
        errorMsg = error.message
      }

      const projectConciliate = await Project.findOne({_id:project._id}).populate('mainDataset')
      const totalDatasets = await DataSet.find({}).count()
      const totalDatasetRows = await DataSetRow.find().count()
      const conciliatedDataset = await DataSet.findOne({_id: dataset._id})

      expect(wasFailed).equal(false)
      expect(errorMsg).equal(errorMsg)
      expect(String(dataset._id)).equal(String(projectConciliate.mainDataset._id))
      expect(totalDatasets).equal(1)
      expect(totalDatasetRows).equal(totalOriginalRows)
      expect(conciliatedDataset.isMain).equal(true)
    })

    it('without dateMax or dateMin should return an exception', async function () {
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
      })

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
      const totalOriginalRows = await DataSetRow.find({organization: org._id}).count()

      let wasFailed = false
      let errorMsg = ''

      try{
        conciliateResult = await conciliateDataset.run({
          dataset: dataset.uuid,
          project: project.uuid
        })
      }catch(error){
        wasFailed = true
        errorMsg = error.message
      }

      expect(wasFailed).equal(true)
      expect(errorMsg).equal('Invalid dateMax or dateMin')
    })

    it('with invalid dataset uuid should return an exception', async function () {
      const user = await createUser()
      const org = await createOrganization()

      const project = await createProject({
        organization: org._id,
        createdBy: user._id
      })

      let wasFailed = false
      let errorMsg = ''

      try{
        conciliateResult = await conciliateDataset.run({
          dataset: 'invalid-uuid',
          project: project.uuid
        })
      }catch(error){
        wasFailed = true
        errorMsg = error.message
      }

      expect(wasFailed).equal(true)
      expect(errorMsg).equal('Invalid project or dataset!')
    })

    it('with invalid project uuid should return an exception', async function () {
      const user = await createUser()

      const org = await createOrganization()

      const project = await createProject({
        organization: org._id,
        createdBy: user._id
      })

      const dataset = await createDataset({
        organization: org._id,
        createdBy: user._id,
        project: project._id,
      })

      let wasFailed = false
      let errorMsg = ''

      try{
        conciliateResult = await conciliateDataset.run({
          dataset: dataset.uuid,
          project: 'invalid-uuid-for-project'
        })
      }catch(error){
        wasFailed = true
        errorMsg = error.message
      }

      expect(wasFailed).equal(true)
      expect(errorMsg).equal('Invalid project or dataset!')
    })

    it('with differents projects in a same conciliate in should return an exception', async function () {
      const user = await createUser()

      const org = await createOrganization()

      const project_one = await createProject({
        organization: org._id,
        createdBy: user._id
      })

      const project_two = await createProject({
        organization: org._id,
        createdBy: user._id
      })

      const dataset = await createDataset({
        organization: org._id,
        createdBy: user._id,
        project: project_one._id,
      })

      const chunk = await createFileChunk()

      dataset.set({
        fileChunk: chunk,
        status: 'ready',
        uploadedBy: user._id
      })

      await dataset.save() 

      datarows = await createDatasetRows({
        organization: org._id,
        project: project_one._id,
        dataset: dataset._id,
        dateMax: "2018-05-16",
        dateMin: "2017-10-04"
      })

      const totalOriginalRows = await DataSetRow.find({organization: org._id}).count()

      let wasFailed = false
      let errorMsg = ''

      try{
        conciliateResult = await conciliateDataset.run({
          dataset: dataset.uuid,
          project: project_two.uuid
        })
      }catch(error){
        wasFailed = true
        errorMsg = error.message
      }

      expect(wasFailed).equal(true)
      expect(errorMsg).equal('Cannot conciliate a dataset from another project!')
    })

  })
})
