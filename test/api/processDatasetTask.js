/* global describe, beforeEach, it */
require('co-mocha')

const { assert, expect } = require('chai')
const { Channel, Product, SalesCenter } = require('models')
const {
  clearDatabase,
  createUser,
  createDataset,
  createOrganization,
  createProject,
  createFileChunk,
  createDatasetRows
} = require('../utils')

const processDataset = require('tasks/dataset/process/process-dataset')


describe('Process datasets', () => {
  beforeEach(async function () {
    await clearDatabase()
  })

  describe('with csv file with 3 products', () => {
    it('should process dataset successfully', async function () {
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

      channels = await Channel.find().count()
      products = await Product.find().count()
      saleCenters = await SalesCenter.find().count()

      expect(channels).equal(3)
      expect(products).equal(3)
      expect(saleCenters).equal(2)
    })
  })
})
