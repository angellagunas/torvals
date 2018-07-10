/* global describe, beforeEach, it */
require('co-mocha')

const api = require('api/')
const http = require('http')
const { expect } = require('chai')
const request = require('supertest')
const { clearDatabase, apiHeaders, createProject } = require('../utils')
const { Engine, ForecastGroup, Rule, Forecast } = require('models')

function test () {
  return request(http.createServer(api.callback()))
}

describe.only('/forecast_group', () => {
  describe('[POST] should return a success response', () => {
    it('with valid request', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()

      const project = await createProject({
        organization: credentials.org._id,
        createdBy: credentials.user._id
      })

      const rule = await Rule.findOne({organization: credentials.org._id})

      const engine = await Engine.create({
        name: 'regression',
        description: 'a models with perfect prediction',
        path: 'http://predictionio.orax.io',
        instructions: '1.- send training data \n2.-build \n3.-deploy \n4.-queries'
      })

      const data = {
        project: project.uuid,
        catalogs: rule.catalogs,
        engines: [engine.uuid],
        alias: 'a_forecast_test'
      }

      const res = await test()
        .post('/api/app/forecastGroups')
        .send(data)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(200)

      expect(res.body.alias).equal(data['alias'])

      expect(await Forecast.find().count()).equals(1)
    })

    it('with valid request and extra field, but without save it', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()

      const project = await createProject({
        organization: credentials.org._id,
        createdBy: credentials.user._id
      })

      const rule = await Rule.findOne({organization: credentials.org._id})

      const engine = await Engine.create({
        name: 'regression',
        description: 'a models with perfect prediction',
        path: 'http://predictionio.orax.io',
        instructions: '1.- send training data \n2.-build \n3.-deploy \n4.-queries'
      })

      const data = {
        project: project.uuid,
        catalogs: rule.catalogs,
        engines: [engine.uuid],
        alias: 'a_forecast_test',
        extraField: 'some value'
      }

      const res = await test()
        .post('/api/app/forecastGroups')
        .send(data)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(200)

      const forecastGroup = await ForecastGroup.find({})

      expect(res.body.alias).equals(data['alias'])
      expect(res.body.extraField).equals(undefined)
      expect(forecastGroup[0].extraField).equals(undefined)
    })
  })

  describe('[POST] should return an error', () => {
    it('without authorization header', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()

      const project = await createProject({
        organization: credentials.org._id,
        createdBy: credentials.user._id
      })

      const rule = await Rule.findOne({organization: credentials.org._id})

      const engine = await Engine.create({
        name: 'regression',
        description: 'a models with perfect prediction',
        path: 'http://predictionio.orax.io',
        instructions: '1.- send training data \n2.-build \n3.-deploy \n4.-queries'
      })

      const data = {
        project: project.uuid,
        catalogs: rule.catalogs,
        engines: [engine.uuid],
        alias: 'a_forecast_test'
      }

      const res = await test()
        .post('/api/app/forecastGroups')
        .send(data)
        .set('Accept', 'application/json')
        .set('Referer', credentials.referer)
        .expect(401)
    })

    it('without project uuid', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()

      const rule = await Rule.findOne({organization: credentials.org._id})

      const engine = await Engine.create({
        name: 'regression',
        description: 'a models with perfect prediction',
        path: 'http://predictionio.orax.io',
        instructions: '1.- send training data \n2.-build \n3.-deploy \n4.-queries'
      })

      const data = {
        forecasts: [],
        catalogs: rule.catalogs,
        engines: [engine.uuid],
        alias: 'a_forecast_test',
        extraField: 'some value'
      }

      const res = await test()
        .post('/api/app/forecastGroups')
        .send(data)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(422)

      expect(res.body.message).equals('value: project: missing required value')
    })

    it('without alias', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()

      const project = await createProject({
        organization: credentials.org._id,
        createdBy: credentials.user._id
      })

      const rule = await Rule.findOne({organization: credentials.org._id})

      const engine = await Engine.create({
        name: 'regression',
        description: 'a models with perfect prediction',
        path: 'http://predictionio.orax.io',
        instructions: '1.- send training data \n2.-build \n3.-deploy \n4.-queries'
      })

      const data = {
        project: project.uuid,
        catalogs: rule.catalogs,
        engines: [engine.uuid]
      }

      const res = await test()
        .post('/api/app/forecastGroups')
        .send(data)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(422)

      expect(res.body.message).equals('value: alias: missing required value')
    })

    it('with forecast array empty', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()

      const project = await createProject({
        organization: credentials.org._id,
        createdBy: credentials.user._id
      })

      const rule = await Rule.findOne({organization: credentials.org._id})

      const engine = await Engine.create({
        name: 'regression',
        description: 'a models with perfect prediction',
        path: 'http://predictionio.orax.io',
        instructions: '1.- send training data \n2.-build \n3.-deploy \n4.-queries'
      })

      const data = {
        project: project.uuid,
        catalogs: rule.catalogs,
        alias: 'a_forecast_test',
        engines: []
      }

      const res = await test()
        .post('/api/app/forecastGroups')
        .send(data)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(422)

      expect(res.body.message).equals('value: engines: missing required value')
    })
  })
})
