/* global describe, beforeEach, it */
require('co-mocha')

const moment = require('moment')

const { assert, expect } = require('chai')
const { Channel, Project, DataSetRow, DataSet, Rule } = require('models')
const {
  clearDatabase,
  createUser,
  createDataset,
  createProject,
  createFileChunk,
  createDatasetRows,
  createFullOrganization
} = require('../utils')

const conciliateDataset = require('tasks/project/conciliate-to-project')
const filterDataset = require('tasks/dataset/process/filter-dataset')


describe('Filter dataset to project', () => {

  describe('with csv file with 3 products', () => {
    it('should conciliate a new dataset with 2 records successfully', async function () {
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

      conciliateResult = await conciliateDataset.run({
        dataset: dataset.uuid,
        project: project.uuid
      })

      const projectConciliate = await Project.findOne({_id:project._id}).populate('mainDataset')
      const totalDatasets = await DataSet.find({}).count()
      const totalNewDatasetRows = await DataSetRow.find({dataset: projectConciliate.mainDataset._id}).count()

      await filterDataset.run({project: project.uuid, dataset: dataset.uuid})

      expect(dataset._id).to.not.equal(projectConciliate.mainDataset._id)
      expect(totalDatasets).equal(2)
      expect(totalNewDatasetRows).equal(12)
    })
  })
})
