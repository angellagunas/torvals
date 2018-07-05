/* global describe, beforeEach, it */
require('co-mocha')

const { DataSetRow, Anomaly, Rule } = require('models')
const { assert, expect } = require('chai')
const saveDataset = require('tasks/dataset/process/save-dataset')
const {
  clearDatabase,
  createUser,
  createDataset,
  createFullOrganization,
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

      const user = await createUser()
      const token = await user.createToken({type: 'session'})
      const jwt = token.getJwt()

      const org = await createFullOrganization()
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

      taskResult = await saveDataset.run({uuid: dataset.uuid})

      totalRows = await DataSetRow.find({dataset:dataset._id}).count()
      totalAnomalies = await Anomaly.find().count()

      const case1 = await DataSetRow.findOne({"data.prediction":8250,"data.sale":4})
      const case2 = await DataSetRow.findOne({"data.prediction":7749,"data.sale":3})
      const case3 = await DataSetRow.findOne({"data.prediction":7344,"data.sale":15})
      const case4 = await DataSetRow.findOne({"data.prediction":4137,"data.sale":6})
      const case5 = await DataSetRow.findOne({"data.prediction":3851,"data.sale":6})
      const case6 = await DataSetRow.findOne({"data.prediction":3598,"data.sale":2})
      const case7 = await DataSetRow.findOne({"data.prediction":7166,"data.sale":4})
      const case8 = await DataSetRow.findOne({"data.prediction":0,"data.sale":70})
      const case9 = await DataSetRow.findOne({"data.prediction":0,"data.sale":70})
      const case10 = await DataSetRow.findOne({"data.prediction":1106,"data.sale":70})
      const case11 = await DataSetRow.findOne({"data.prediction":1106,"data.sale":70})
      const case12 = await DataSetRow.findOne({"data.prediction":1106,"data.sale":5})

      expect(dataset.name).equal('Dataset with processing as status')
      expect(totalRows).equal(12)
      expect(totalAnomalies).equal(0)

      assert.exists(case1)
      assert.exists(case2)
      assert.exists(case3)
      assert.exists(case4)
      assert.exists(case5)
      assert.exists(case6)
      assert.exists(case7)
      assert.exists(case8)
      assert.exists(case9)
      assert.exists(case10)
      assert.exists(case11)
      assert.exists(case12)

      expect(case1.data.productExternalId).equal("123109")

      expect(case2.data.productExternalId).equal("123109")

      expect(case3.data.productExternalId).equal("123109")

      expect(case4.data.productExternalId).equal("123110")

      expect(case5.data.productExternalId).equal("123110")

      expect(case6.data.productExternalId).equal("123110")

      expect(case7.data.productExternalId).equal("123109")

      expect(case8.data.productExternalId).equal("122928")

      expect(case9.data.productExternalId).equal("122928")

      expect(case10.data.productExternalId).equal("123109")

      expect(case11.data.productExternalId).equal("123109")

      expect(case12.data.productExternalId).equal("123109")
    })
  })
})
