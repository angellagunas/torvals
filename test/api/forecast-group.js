/* global describe, beforeEach, it */
require('co-mocha')

const api = require('api/')
const http = require('http')
const { expect } = require('chai')
const request = require('supertest')
const { clearDatabase, apiHeaders, createProject, createDataset } = require('../utils')
const { Engine, ForecastGroup, Rule, Forecast } = require('models')

function test () {
  return request(http.createServer(api.callback()))
}

describe('/forecast_group', () => {
  describe('[POST] should return a success response', () => {
    it('with valid request', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()
      const rule = await Rule.findOne({organization: credentials.org._id})

      const project = await createProject({
        organization: credentials.org._id,
        createdBy: credentials.user._id
      })

      const dataset = await createDataset({
        organization: credentials.org._id,
        createdBy: credentials.user._id,
        project: project._id,
        dateMax: "2018-05-16",
        dateMin: "2017-10-04"
      })

      project.set({
        mainDataset: dataset._id,
        dateMin: dataset.dateMin,
        dateMax: dataset.dateMax,
        rule: rule._id
      })

      dataset.set({
        isMain: true,
        status: 'ready'
      })

      await dataset.save()
      await project.save()


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

      const dataset = await createDataset({
        organization: credentials.org._id,
        createdBy: credentials.user._id,
        project: project._id,
        dateMax: "2018-05-16",
        dateMin: "2017-10-04"
      })

      project.set({
        mainDataset: dataset._id,
        dateMin: dataset.dateMin,
        dateMax: dataset.dateMax
      })

      dataset.set({
        isMain: true,
        status: 'ready'
      })

      await dataset.save()
      await project.save()

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

    it('with engines array empty', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()

      const project = await createProject({
        organization: credentials.org._id,
        createdBy: credentials.user._id
      })

      const dataset = await createDataset({
        organization: credentials.org._id,
        createdBy: credentials.user._id,
        project: project._id,
        dateMax: "2018-05-16",
        dateMin: "2017-10-04"
      })

      project.set({
        mainDataset: dataset._id,
        dateMin: dataset.dateMin,
        dateMax: dataset.dateMax
      })

      dataset.set({
        isMain: true,
        status: 'ready'
      })

      await dataset.save()
      await project.save()

      const rule = await Rule.findOne({organization: credentials.org._id})

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

      expect(res.body.message).equals('Debes seleccionar por lo menos un modelo de predicciones')
    })

    it('with project without mainDataset', async function () {
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
        engines: [engine.uuid]
      }

      const res = await test()
        .post('/api/app/forecastGroups')
        .send(data)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(422)

      expect(res.body.message).equals('El proyecto no tiene un dataset principal')
    })
  })
})
