/* global describe, beforeEach, it */
require('co-mocha')

const moment = require('moment')

const { assert, expect } = require('chai')
const { Engine, Forecast, ForecastGroup } = require('models')

const {
  clearDatabase,
  apiHeaders,
  createProject,
  createDataset
} = require('../utils')


describe('Forecast Model', () => {

  describe('should be saved success', () => {
    it('with full data', async function () {
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
        uuid: 'a_static_uuid'
      })

      assert.exists(forecast)
      expect(await Forecast.count()).equals(1)
    })

    it('with default status', async function () {
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
        catalogs: initialData.org.catalogs,
        dataset: dataset._id,
        engine: engine._id,
        forecastGroup: forecastGroup._id,
        dateEnd: moment.utc(),
        dateStart: moment.utc(),
        instanceKey: 'a_random_intance_key',
        port: 1000,
        uuid: 'a_static_uuid'
      })

      assert.exists(forecast)
      expect(await Forecast.count()).equals(1)
      expect(forecast.status).equals('created')
    })

    it('without dataset', async function () {
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
        engine: engine._id,
        forecastGroup: forecastGroup._id,
        dateEnd: moment.utc(),
        dateStart: moment.utc(),
        instanceKey: 'a_random_intance_key',
        port: 1000,
        status: 'created',
        uuid: 'a_static_uuid'
      })

      assert.exists(forecast)
      expect(await Forecast.count()).equals(1)
    })

    it('without approvedBy property', async function () {
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
        catalogs: [],
        dataset: dataset._id,
        engine: engine._id,
        forecastGroup: forecastGroup._id,
        dateEnd: moment.utc(),
        dateStart: moment.utc(),
        instanceKey: 'a_random_intance_key',
        port: 1000,
        status: 'created',
        uuid: 'a_static_uuid'
      })

      assert.exists(forecast)
      expect(await Forecast.count()).equals(1)
    })

    it('and save port as number', async function () {
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
        uuid: 'a_static_uuid'
      })

      expect(typeof forecast.port).equals('number')
      expect(typeof dataset.__v).equals('number')
    })
  })

  describe('should return an error', () => {
    it('without engine', async function () {
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

      let wasFailed = false

      try{
        const forecast = await Forecast.create({
          approvedBy: initialData.user._id,
          catalogs: [],
          dataset: dataset._id,
          forecastGroup: forecastGroup._id,
          dateEnd: moment.utc(),
          dateStart: moment.utc(),
          instanceKey: 'a_random_intance_key',
          port: 1000,
          status: 'created',
          uuid: 'a_static_uuid'
        })
      }catch(error){
        wasFailed = true
      }

      expect(await Forecast.count()).equals(0)
      expect(wasFailed).equals(true)
    })

    it('without forecast group', async function () {
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

      let wasFailed = false

      try{
        const forecast = await Forecast.create({
          approvedBy: initialData.user._id,
          catalogs: [],
          engine: engine._id,
          dataset: dataset._id,
          dateEnd: moment.utc(),
          dateStart: moment.utc(),
          instanceKey: 'a_random_intance_key',
          port: 1000,
          status: 'created',
          uuid: 'a_static_uuid'
        })
      }catch(error){
        wasFailed = true
      }

      expect(await Forecast.count()).equals(0)
      expect(wasFailed).equals(true)
    })

    it('without forecast group', async function () {
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

      let wasFailed = false

      try{
        const forecast = await Forecast.create({
          approvedBy: initialData.user._id,
          catalogs: [],
          engine: engine._id,
          dataset: dataset._id,
          dateEnd: moment.utc(),
          dateStart: moment.utc(),
          instanceKey: 'a_random_intance_key',
          port: 1000,
          status: 'created',
          uuid: 'a_static_uuid'
        })
      }catch(error){
        wasFailed = true
      }

      expect(await Forecast.count()).equals(0)
      expect(wasFailed).equals(true)
    })

    it('with duplicated uuid', async function () {
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

      let wasFailed = false

      try{
        const data = {
          approvedBy: initialData.user._id,
          catalogs: [],
          engine: engine._id,
          forecastGroup: forecastGroup._id,
          dataset: dataset._id,
          dateEnd: moment.utc(),
          dateStart: moment.utc(),
          instanceKey: 'a_random_intance_key',
          port: 1000,
          status: 'created',
          uuid: 'a_static_uuid'
        }

        const firstForecast = await Forecast.create(data)
        const secondForecast = await Forecast.create(data)
      }catch(error){
        wasFailed = true
      }

      expect(wasFailed).equals(true)
      expect(await Forecast.count()).equals(1)
    })

    it('without instanceKey', async function () {
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

      let wasFailed = false

      try{
        const data = {
          approvedBy: initialData.user._id,
          catalogs: [],
          engine: engine._id,
          forecastGroup: forecastGroup._id,
          dataset: dataset._id,
          dateEnd: moment.utc(),
          dateStart: moment.utc(),
          port: 1000,
          status: 'created',
          uuid: 'a_static_uuid'
        }

        const forecast = await Forecast.create(data)
      }catch(error){
        wasFailed = true
      }

      expect(wasFailed).equals(true)
      expect(await Forecast.count()).equals(0)
    })

    it('with duplicated instanceKey', async function () {
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

      let wasFailed = false

      try{
        const data = {
          approvedBy: initialData.user._id,
          catalogs: [],
          engine: engine._id,
          forecastGroup: forecastGroup._id,
          dataset: dataset._id,
          dateEnd: moment.utc(),
          dateStart: moment.utc(),
          instanceKey: 'a_random_intance_key',
          port: 1000
        }

        const firstForecast = await Forecast.create(data)
        const secondForecast = await Forecast.create(data)
      }catch(error){
        wasFailed = true
      }

      expect(wasFailed).equals(true)
      expect(await Forecast.count()).equals(1)
    })

    it('with invalid status', async function () {
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

      let wasFailed = false

      try{
        const data = {
          approvedBy: initialData.user._id,
          catalogs: [],
          engine: engine._id,
          forecastGroup: forecastGroup._id,
          dataset: dataset._id,
          dateEnd: moment.utc(),
          dateStart: moment.utc(),
          instanceKey: 'a_random_intance_key',
          port: 1000,
          status: 'invalid_status'
        }

        const forecast = await Forecast.create(data)
      }catch(error){
        wasFailed = true
      }

      expect(wasFailed).equals(true)
      expect(await Forecast.count()).equals(0)
    })
  })
})
