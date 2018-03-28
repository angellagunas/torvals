/* global describe, beforeEach, it */
require('co-mocha')

const { expect } = require('chai')
const http = require('http')
const { clearDatabase } = require('../utils')
const api = require('api/')
const request = require('supertest')
const {RequestLog} = require('models')

function test () {
  return request(http.createServer(api.callback()))
}

describe('Request logs', () => {
  beforeEach(async function () {
    await clearDatabase()
  })

  describe('[get] / list request logs', () => {
    it('should return a 200 with a 0 request logs', async function () {
      const res = await test()
        .get('/api/request-logs')
        .set('Accept', 'application/json')
        .expect(200)

      // find request log w good response
      expect(res.body.data.length).equal(0)
    })

  describe.skip('[get] /Create wrong request-log', () => {
    it('should create the request-log with error', async function () {
      await test()
        .post('/api/wrong-url-123123')
        .set('Accept', 'application/json')

      // find request log w error
      const errorLog = await RequestLog.findOne({})
      expect(errorLog).to.have.property('error')
    })
  })

  describe('[get] /request-logs Gets request logs', () => {
    it('should return request logs', async function () {
      await test()
        .get('/api/request-logs')
        .set('Accept', 'application/json')
        .expect(200)

      // find request log w good response
      expect(res.body.data.length).equal(2)
    })
  })
})
