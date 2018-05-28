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

      const case1 = await DataSetRow.findOne({"data.prediction":8250,"data.sale":4,"data.semanaBimbo":41})
      const case2 = await DataSetRow.findOne({"data.prediction":7749,"data.sale":3,"data.semanaBimbo":42})
      const case3 = await DataSetRow.findOne({"data.prediction":7344,"data.sale":15,"data.semanaBimbo":43})
      const case4 = await DataSetRow.findOne({"data.prediction":4137,"data.sale":6,"data.semanaBimbo":12})
      const case5 = await DataSetRow.findOne({"data.prediction":3851,"data.sale":6,"data.semanaBimbo":13})
      const case6 = await DataSetRow.findOne({"data.prediction":3598,"data.sale":2,"data.semanaBimbo":14})
      const case7 = await DataSetRow.findOne({"data.prediction":7166,"data.sale":4,"data.semanaBimbo":44})
      const case8 = await DataSetRow.findOne({"data.prediction":0,"data.sale":70,"data.semanaBimbo":17})
      const case9 = await DataSetRow.findOne({"data.prediction":0,"data.sale":70,"data.semanaBimbo":18})
      const case10 = await DataSetRow.findOne({"data.prediction":1106,"data.sale":70,"data.semanaBimbo":19})
      const case11 = await DataSetRow.findOne({"data.prediction":1106,"data.sale":70,"data.semanaBimbo":20})
      const case12 = await DataSetRow.findOne({"data.prediction":1106,"data.sale":5,"data.semanaBimbo":21})

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

      expect(case1.data.salesCenterExternalId).equal("12604")
      expect(case1.data.channelExternalId).equal("1")
      expect(case1.data.productExternalId).equal("123109")

      expect(case2.data.salesCenterExternalId).equal("12604")
      expect(case2.data.channelExternalId).equal("1")
      expect(case2.data.productExternalId).equal("123109")

      expect(case3.data.salesCenterExternalId).equal("12604")
      expect(case3.data.channelExternalId).equal("1")
      expect(case3.data.productExternalId).equal("123109")

      expect(case4.data.salesCenterExternalId).equal("12604")
      expect(case4.data.channelExternalId).equal("1")
      expect(case4.data.productExternalId).equal("123110")

      expect(case5.data.salesCenterExternalId).equal("12604")
      expect(case5.data.channelExternalId).equal("1")
      expect(case5.data.productExternalId).equal("123110")

      expect(case6.data.salesCenterExternalId).equal("12604")
      expect(case6.data.channelExternalId).equal("1")
      expect(case6.data.productExternalId).equal("123110")

      expect(case7.data.salesCenterExternalId).equal("12604")
      expect(case7.data.channelExternalId).equal("1")
      expect(case7.data.productExternalId).equal("123109")

      expect(case8.data.salesCenterExternalId).equal("12837")
      expect(case8.data.channelExternalId).equal("4")
      expect(case8.data.productExternalId).equal("122928")

      expect(case9.data.salesCenterExternalId).equal("12837")
      expect(case9.data.channelExternalId).equal("4")
      expect(case9.data.productExternalId).equal("122928")

      expect(case10.data.salesCenterExternalId).equal("12837")
      expect(case10.data.channelExternalId).equal("2")
      expect(case10.data.productExternalId).equal("123109")

      expect(case11.data.salesCenterExternalId).equal("12837")
      expect(case11.data.channelExternalId).equal("2")
      expect(case11.data.productExternalId).equal("123109")

      expect(case12.data.salesCenterExternalId).equal("12837")
      expect(case12.data.channelExternalId).equal("2")
      expect(case12.data.productExternalId).equal("123109")
    })
  })
})
