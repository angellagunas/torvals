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

      detalleChannel = await Channel.findOne({externalId: 1})
      autoServicioChannel = await Channel.findOne({externalId: 2})
      convenienciaChannel = await Channel.findOne({externalId: 4})

      product1 = await Product.findOne({externalId: "123109", name:"Takis Fuego 62G Co2 Bar"})
      product2 = await Product.findOne({externalId: "123110", name:"Runners 58G Co2 Bar"})
      product3 = await Product.findOne({externalId: "122928", name:"Pecositas 70P 9 8G Ric"})

      saleCenter1 = await SalesCenter.findOne({externalId: "12604", name: "Not identified"})
      saleCenter2 = await SalesCenter.findOne({externalId: "12837", name: "Not identified"})

      expect(channels).equal(3)
      expect(products).equal(3)
      expect(saleCenters).equal(2)

      assert.exists(detalleChannel)
      assert.exists(autoServicioChannel)
      assert.exists(convenienciaChannel)

      expect(detalleChannel.name).equal("detalle")
      expect(autoServicioChannel.name).equal("autoservicio")
      expect(convenienciaChannel.name).equal("conveniencia")

      assert.exists(product1)
      assert.exists(product2)
      assert.exists(product3)

      assert.exists(saleCenter1)
      assert.exists(saleCenter2)
    })
  })
})
