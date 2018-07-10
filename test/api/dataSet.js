/* global describe, beforeEach, it */
require('co-mocha')

const { expect } = require('chai')
const http = require('http')
const {
  apiHeaders,
  clearDatabase,
  createDataset,
  createProject,
  createUser
} = require('../utils')
const api = require('api/')
const request = require('supertest')
const {DataSet, Organization, User} = require('models')

function test () {
  return request(http.createServer(api.callback()))
}

describe('/datasets', () => {

  describe('[post] / Create dataSets', () => {
    it('should return a 200 then the dataset created', async function () {
      await clearDatabase()

      const credentials = await apiHeaders()

      const project = await createProject({
        organization: credentials.org._id,
        createdBy: credentials.user._id
      })

      const res = await test()
        .post('/api/admin/datasets')
        .send({
          name: 'Un dataset',
          description: 'Una descripción',
          organization: credentials.org.uuid,
          project: project.uuid
        })
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(200)

      const newDataSet = await DataSet.findOne({'uuid': res.body.data.uuid})
      expect(newDataSet.name).equal('Un dataset')
      expect(newDataSet.description).equal('Una descripción')
    })

    describe('[get] / Obtain dataSets', () => {
      it('should return a 200', async function () {
        await clearDatabase()
        const credentials = await apiHeaders()

        const res = await test()
        .get('/api/admin/datasets')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(200)
      })

      it('should return list of datasets', async function () {
        await clearDatabase()
        const credentials = await apiHeaders()

        const project = await createProject({
          organization: credentials.org._id,
          createdBy: credentials.user._id
        })

        const dataset = await createDataset({
          organization: credentials.org._id,
          createdBy: credentials.user._id,
          project: project._id
        })

        const res = await test()
        .get('/api/admin/datasets')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(200)

        const totalDatasets = await DataSet.find().count()
        expect(res.body.total).equal(totalDatasets)
      })
    })

    describe('[delete] / Soft Delete dataSet', () => {
      it('should return true for deleted', async function () {
        await clearDatabase()
        const credentials = await apiHeaders()

        const project = await createProject({
          organization: credentials.org._id,
          createdBy: credentials.user._id
        })

        const dataset = await createDataset({
          organization: credentials.org._id,
          createdBy: credentials.user._id,
          project: project._id
        })

        const res = await test()
        .delete('/api/admin/datasets/' + dataset.uuid)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(200)

        expect(res.body.data.isDeleted).equal(true)
      })
    })
  })
})
