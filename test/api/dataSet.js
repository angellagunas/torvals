/* global describe, beforeEach, it */
require('co-mocha')

const { expect } = require('chai')
const http = require('http')
const { clearDatabase, createUser } = require('../utils')
const api = require('api/')
const request = require('supertest')
const {DataSet, Organization, User} = require('models')

function test () {
  return request(http.createServer(api.callback()))
}

describe('/datasets', () => {
  const password = '1234'

  beforeEach(async function () {
    // await clearDatabase()
  })

  describe.only('[post] / Create dataSets', () => {
    it('should return a 200 then the dataset created', async function () {
      await clearDatabase()
      const user = await createUser({ password })
      const org = await Organization.create({
        name: 'Una org',
        description: 'Una descripción'
      })

      const res = await test()
        .post('/api/admin/datasets')
        .send({
          name: 'Un dataset',
          description: 'Una descripción',
          organization: org.uuid

        })
        .set('Accept', 'application/json')
        .expect(200)

      const newDataSet = await DataSet.findOne({'uuid': res.body.data.uuid})
      expect(newDataSet.name).equal('Un dataset')
      expect(newDataSet.description).equal('Una descripción')
    })

    describe('[get] / Obtain dataSets', () => {
      it('should return a 200', async function () {
        await test()
        .get('/api/admin/datasets')
        .set('Accept', 'application/json')
        .expect(200)
      })

      it('should return list of datasets', async function () {
        const res = await test()
        .get('/api/admin/datasets')
        .set('Accept', 'application/json')
        .expect(200)

        const datasets = await DataSet.findOne({name: 'Un dataset'})
        expect(datasets.name).equal('Un dataset')
      })
    })

    describe('[delete] / Soft Delete dataSet', () => {
      it('should return true for deleted', async function () {
        const datasets = await DataSet.findOne({name: 'Un dataset'})
        const res = await test()
        .delete('/api/admin/datasets/' + datasets.uuid)
        .set('Accept', 'application/json')
        .expect(200)

        expect(res.body.data.isDeleted).equal(true)
      })
    })
  })
})
