/* global describe, beforeEach, it */
require('co-mocha')

const { assert, expect } = require('chai')
const http = require('http')
const { clearDatabase, createUser, createDataset } = require('../utils')
const api = require('api/')
const request = require('supertest')
const {DataSet, Organization, User, Project, FileChunk, DataSetRow} = require('models')
const saveDataset = require('tasks/dataset/process/save-dataset')

function test () {
  return request(http.createServer(api.callback()))
}

describe('Configure datasets', () => {
  beforeEach(async function () {
    // await clearDatabase()
  })

  describe('with csv file with 3 products', () => {
    it('should be add rows successfully', async function () {
      this.timeout(1000 * 20);
      await clearDatabase()
      const user = await createUser()
      const token = await user.createToken({type: 'session'})
      const jwt = token.getJwt()

      const org = await Organization.create({
        name: 'Organization test',
        description: 'Little description about the organization'
      })

      const project = await Project.create({
        name: "Project test",
        description: "Little description about the project",
        organization: org._id,
        createdBy: user._id
      })

      const dataset = await createDataset({
        organization: org._id,
        createdBy: user._id,
        uploadedBy: user._id,
        project: project._id
      })

      const chunk = await FileChunk.create({
        lastChunk: 1,
        fileType: "text/csv",
        fileId: "datasetsTest",
        filename: "forecasts_3-prods_2017-2018.csv",
        path: "test/fixtures/datasetsTest",
        totalChunks: 1
      }) 

      dataset.set({
        fileChunk: chunk,
        status: 'uploading',
        uploadedBy: user._id
      })

      await dataset.save()

      taskResult = await saveDataset.run({uuid: dataset.uuid})

      totalRows = await DataSetRow.find({dataset:dataset._id}).count()

      expect(dataset.name).equal('dataset_with_3_productos')
      assert.isAbove(totalRows, 0)
    })
  })
})
