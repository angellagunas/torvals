/* global describe, beforeEach, it */
require('co-mocha')

const api = require('api/')
const http = require('http')
const { expect } = require('chai')
const request = require('supertest')
const { clearDatabase, apiHeaders } = require('../utils')
const { Engine } = require('models')

function test () {
  return request(http.createServer(api.callback()))
}

describe('/engines', () => {

  describe('[GET] as admin', () => {
    it('with valid request should return a list of engines', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()

      const engine = await Engine.create({
        name: 'regression',
        description: 'a models with perfect prediction',
        path: 'http://predictionio.orax.io',
        instructions: '1.- send training data \n2.-build \n3.-deploy \n4.-queries'
      })

      const res = await test()
        .get('/api/admin/engines')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(200)

      expect(res.body.data[0].name).equal(engine.name)
    })

    it('with valid request should return only if isDeleted is false', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()

      await Engine.create({
        name: 'regression',
        description: 'a models with perfect prediction',
        path: 'http://predictionio.orax.io',
        instructions: '1.- send training data \n2.-build \n3.-deploy \n4.-queries',
        isDeleted: true
      })

      const res = await test()
        .get('/api/admin/engines')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(200)

      expect(res.body.data.length).equal(0)
    })

    it('without authorization headers should return a 401 status', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()

      const engine = await Engine.create({
        name: 'regression',
        description: 'a models with perfect prediction',
        path: 'http://predictionio.orax.io',
        instructions: '1.- send training data \n2.-build \n3.-deploy \n4.-queries'
      })

      const res = await test()
        .get('/api/admin/engines')
        .set('Accept', 'application/json')
        .set('Referer', credentials.referer)
        .expect(401)
    })
  })

  describe('[GET] in app', () => {
    it('with valid request should return a list of engines', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()

      const engine = await Engine.create({
        name: 'regression',
        description: 'a models with perfect prediction',
        path: 'http://predictionio.orax.io',
        instructions: '1.- send training data \n2.-build \n3.-deploy \n4.-queries'
      })

      const res = await test()
        .get('/api/app/engines')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(200)

      expect(res.body.data[0].name).equal(engine.name)
    })

    it('with valid request should return only if isDeleted is false', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()

      await Engine.create({
        name: 'regression',
        description: 'a models with perfect prediction',
        path: 'http://predictionio.orax.io',
        instructions: '1.- send training data \n2.-build \n3.-deploy \n4.-queries',
        isDeleted: true
      })

      const res = await test()
        .get('/api/app/engines')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(200)

      expect(res.body.data.length).equal(0)
    })

    it('without authorization headers should return a 401 status', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()

      const engine = await Engine.create({
        name: 'regression',
        description: 'a models with perfect prediction',
        path: 'http://predictionio.orax.io',
        instructions: '1.- send training data \n2.-build \n3.-deploy \n4.-queries'
      })

      const res = await test()
        .get('/api/app/engines')
        .set('Accept', 'application/json')
        .set('Referer', credentials.referer)
        .expect(401)
    })
  })
})
