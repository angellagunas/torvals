/* global describe, beforeEach, it */
require('co-mocha')

const moment = require('moment')

const { assert, expect } = require('chai')
const { Engine, Forecast, ForecastGroup } = require('models')
const { clearDatabase, apiHeaders, createProject } = require('../utils')


describe('ForecastGroup Model', () => {

  describe('should be saved success', () => {
    it('with correct data', async function () {
      await clearDatabase()
      const initialData = await apiHeaders()

      const project = await createProject({
        organization: initialData.org._id,
        createdBy: initialData.user._id
      })

      const data = {
        project: project._id,
        forecasts: [],
        type: 'informative',
        alias: 'a_forecast_test',
        createdBy: initialData.user._id
      }

      const group = await ForecastGroup.create(data)

      assert.exists(group)
      expect(await ForecastGroup.find().count()).equals(1)
    })

    it('without alias', async function () {
      await clearDatabase()
      const initialData = await apiHeaders()

      const project = await createProject({
        organization: initialData.org._id,
        createdBy: initialData.user._id
      })

      const data = {
        project: project._id,
        forecasts: [],
        type: 'informative',
        createdBy: initialData.user._id
      }

      const group = await ForecastGroup.create(data)

      assert.exists(group)
      expect(await ForecastGroup.find().count()).equals(1)
    })

    it('with default type', async function () {
      await clearDatabase()
      const initialData = await apiHeaders()

      const project = await createProject({
        organization: initialData.org._id,
        createdBy: initialData.user._id
      })

      const data = {
        project: project._id,
        forecasts: [],
        alias: 'a_forecast_test',
        createdBy: initialData.user._id
      }

      const group = await ForecastGroup.create(data)

      assert.exists(group)
      expect(await ForecastGroup.find().count()).equals(1)
    })
  })

  describe('should return error', () => {
    it('without createdBy property', async function () {
      await clearDatabase()
      const initialData = await apiHeaders()

      const project = await createProject({
        organization: initialData.org._id,
        createdBy: initialData.user._id
      })

      const data = {
        project: project._id,
        forecasts: [],
        alias: 'a_forecast_test',
        type: 'informative'
      }

      let wasFailed = false

      try{
        const group = await ForecastGroup.create(data)
      }catch(error){
        wasFailed = true
      }

      expect(wasFailed).equals(true)
      expect(await ForecastGroup.find().count()).equals(0)
    })

    it('with duplicated uuid', async function () {
      await clearDatabase()
      const initialData = await apiHeaders()

      const project = await createProject({
        organization: initialData.org._id,
        createdBy: initialData.user._id
      })

      const data = {
        project: project._id,
        forecasts: [],
        alias: 'a_forecast_test',
        type: 'informative',
        uuid: 'a_duplicated_uuid',
        createdBy: initialData.user._id
      }

      let wasFailed = false

      try{
        const firstForecastGroup = await ForecastGroup.create(data)
        const secondForecastGroup = await ForecastGroup.create(data)
      }catch(error){
        wasFailed = true
      }

      expect(wasFailed).equals(true)
      expect(await ForecastGroup.find().count()).equals(1)
    })

    it('without project', async function () {
      await clearDatabase()
      const initialData = await apiHeaders()

      const project = await createProject({
        organization: initialData.org._id,
        createdBy: initialData.user._id
      })

      const data = {
        forecasts: [],
        alias: 'a_forecast_test',
        type: 'informative',
        createdBy: initialData.user._id
      }

      let wasFailed = false

      try{
        const forecastGroup = await ForecastGroup.create(data)
      }catch(error){
        wasFailed = true
      }

      expect(wasFailed).equals(true)
      expect(await ForecastGroup.find().count()).equals(0)
    })

    it('with invalid type', async function () {
      await clearDatabase()
      const initialData = await apiHeaders()

      const project = await createProject({
        organization: initialData.org._id,
        createdBy: initialData.user._id
      })

      const data = {
        project: project._id,
        forecasts: [],
        alias: 'a_forecast_test',
        type: 'invalid_type',
        createdBy: initialData.user._id
      }

      let wasFailed = false

      try{
        const forecastGroup = await ForecastGroup.create(data)
      }catch(error){
        wasFailed = true
      }

      expect(wasFailed).equals(true)
      expect(await ForecastGroup.find().count()).equals(0)
    })
  })
})
