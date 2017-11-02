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
    await clearDatabase()
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

        const datasets = await DataSet.find()
        console.log(datasets)
        expect(datasets).equal(res.body.data)
    })
  })

  describe.only('[post] / Create dataSets', () => {
    
    it('should return a 200 then the dataset created', async function () {
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
          path: '/assadasd',
          organization: org._id,
          uploadedBy: user._id,
          type: 'univariable-time-series',

          status: 'new',

          columns: [{
            isDate: false,
            analyze: '',
            isOperationFilter: false,
            isAnalysisFilter: false,
            distinctValues: ''
          }],

          groupings: [{
            column: '',
            inputValue: '',
            outputValue: ''
          }],
        })
        .set('Accept', 'application/json')
        .expect(200)

      
      const newDataSet = await DataSet.findOne({'uuid': res.body.data.uuid})
      expect(newDataSet.name).equal('Un dataset')
      expect(newDataSet.description).equal('Una descripción')
      expect(newDataSet.path).equal('/assadasd')
      expect(String(newDataSet.uploadedBy)).equal(String(user._id))
      expect(String(newDataSet.organization)).equal(String(org._id))
    })

  })
  

})
