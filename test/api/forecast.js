/* global describe, beforeEach, it */
require('co-mocha')

const moment = require('moment')

const api = require('api/')
const http = require('http')
const { expect } = require('chai')
const request = require('supertest')
const { clearDatabase, apiHeaders, createProject, createDataset } = require('../utils')
const { Engine, ForecastGroup, Rule, Forecast } = require('models')

function test () {
  return request(http.createServer(api.callback()))
}

describe('/forecasts', () => {
  describe('[GET] /conciliate/:uuid', () => {
    it('should be OK with valid request', async function () {
      await clearDatabase()
      const initialData = await apiHeaders()

      const project = await createProject({
        organization: initialData.org._id,
        createdBy: initialData.user._id
      })

      const forecastGroup = await ForecastGroup.create({
        project: project._id,
        forecasts: [],
        type: 'informative',
        alias: 'a_forecast_test',
        createdBy: initialData.user._id
      })

      const engine = await Engine.create({
        name: 'regression',
        descrition: 'a models with perfect prediction',
        path: 'http://predictionio.orax.io',
        instructions: '1.- some instructions'
      })

      const dataset = await createDataset({
        createdBy: initialData.user._id,
        organization: initialData.user._id,
        project: project._id
      })

      const forecast = await Forecast.create({
        approvedBy: initialData.user._id,
        catalogs: [],
        dataset: dataset._id,
        engine: engine._id,
        forecastGroup: forecastGroup._id,
        dateEnd: moment.utc(),
        dateStart: moment.utc(),
        instanceKey: 'a_random_intance_key',
        port: 1000,
        status: 'created',
        uuid: 'a_static_uuid',
        project: project._id
      })

      const res = await test()
        .get('/api/app/forecasts/conciliate/'+forecast.uuid)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${initialData.token}`)
        .set('Referer', initialData.referer)
        .expect(200)

      expect(res.body.data.status).equal('ready')
    })
  })

  describe('[DELETE] /', () => {
    it('should delete all forecast and datasets not conciliated', async function () {
      await clearDatabase()
      const initialData = await apiHeaders()

      const project = await createProject({
        organization: initialData.org._id,
        createdBy: initialData.user._id
      })

      const forecastGroup = await ForecastGroup.create({
        project: project._id,
        forecasts: [],
        type: 'informative',
        alias: 'a_forecast_test',
        createdBy: initialData.user._id
      })

      const engine = await Engine.create({
        name: 'regression',
        descrition: 'a models with perfect prediction',
        path: 'http://predictionio.orax.io',
        instructions: '1.- some instructions'
      })

      const dataset = await createDataset({
        createdBy: initialData.user._id,
        organization: initialData.user._id,
        project: project._id
      })

      const forecast = await Forecast.create({
        approvedBy: initialData.user._id,
        catalogs: [],
        dataset: dataset._id,
        engine: engine._id,
        forecastGroup: forecastGroup._id,
        dateEnd: moment.utc(),
        dateStart: moment.utc(),
        instanceKey: 'a_random_intance_key',
        port: 1000,
        status: 'created',
        uuid: 'a_static_uuid',
        project: project._id
      })

      const res = await test()
        .post('/api/app/forecasts/delete')
        .send({forecasts: [forecast.uuid]})
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${initialData.token}`)
        .set('Referer', initialData.referer)
        .expect(200)

      expect(res.body.data[0].uuid).equal(forecast.uuid)
    })
  })
})
