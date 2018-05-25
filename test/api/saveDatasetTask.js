/* global describe, beforeEach, it */
require('co-mocha')

const { DataSetRow, Anomaly } = require('models')
const { assert, expect } = require('chai')
const saveDataset = require('tasks/dataset/process/save-dataset')
const {
  clearDatabase,
  createUser,
  createDataset,
  createOrganization,
  createProject,
  createFileChunk
} = require('../utils')


describe('Configure datasets', () => {
  beforeEach(async function () {
    await clearDatabase()
  })

  describe('with csv file with 3 products', () => {
    it('should be add rows successfully', async function () {
      this.timeout(1000 * 20);

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
        project: project._id
      })

      const chunk = await createFileChunk()

      dataset.set({
        fileChunk: chunk,
        status: 'uploading',
        uploadedBy: user._id
      })

      await dataset.save()

      taskResult = await saveDataset.run({uuid: dataset.uuid})

      totalRows = await DataSetRow.find({dataset:dataset._id}).count()
      totalAnomalies = await Anomaly.find().count()

      expect(dataset.name).equal('Dataset with processing as status')
      expect(totalRows).equal(12)
      expect(totalAnomalies).equal(0)
    })
  })
})
