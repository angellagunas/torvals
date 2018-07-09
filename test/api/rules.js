/* global describe, beforeEach, it */
require('co-mocha')

const { assert } = require('chai')
const http = require('http')
const { clearDatabase, createUser } = require('../utils')
const api = require('api/')
const request = require('supertest')
const {DataSet, Organization, User, Rule} = require('models')

const rule = {
  important: true,
  startDate: '2018-01-01T00:00:00',
  cycleDuration: 1,
  cycle: 'M',
  period: 'w',
  periodDuration: 1,
  season: 12,
  cyclesAvailable:6,
  ranges: [0, 0, 0, 0, 0, 0],
  rangesLvl2: [0, 0, 0, 0, 0, 0],
  catalogs: [{slug: 'producto', name: 'producto'}],
  takeStart: true,
  consolidation: 26,
  forecastCreation: 1,
  rangeAdjustment: 1,
  rangeAdjustmentRequest: 1,
  salesUpload : 1
}

function test () {
  return request(http.createServer(api.callback()))
}

describe('organizations/rules/:uuid', () => {
  beforeEach(async function () {
    await clearDatabase()
  })

  describe('with extra data', () => {
    it('should not save a extra fields', async function () {
      const org = await Organization.create({slug:'test-org'})

      const user = await createUser()
      const token = await user.createToken({type: 'session'})
      const jwt = token.getJwt()

      rules = Object.assign(rule, {extraField: 'random value'})

      const response = await test()
        .post(`/api/app/rules` )
        .send(rule)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${jwt}`)
        .set('Referer', 'http://test-org.orax.com')
        .expect(200)

      const newRule = await Rule.findOne({organization: org._id})

      assert.notExists(newRule.extraField)
    })
  })

  describe('with invalid organization', () => {
    it('should return a 404 status code', async function () {
      const org = await Organization.create({slug:'test-org'})
      const user = await createUser()
      const token = await user.createToken({type: 'session'})
      const jwt = token.getJwt()

      const response = await test()
        .post(`/api/app/rules/invalid-uuid` )
        .send(rule)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${jwt}`)
        .set('Referer', 'http://test-org.orax.com')
        .expect(404)
    })
  })

  describe('with correct information', () => {
    it('should return a 200 and the rules', async function () {
      const user = await createUser()
      const token = await user.createToken({type: 'session'})
      const jwt = token.getJwt()

      const org = await Organization.create({slug:'test-org'})

      const response = await test()
        .post(`/api/app/rules` )
        .send(rule)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${jwt}`)
        .set('Referer', 'http://test-org.orax.com')
        .expect(200)

      assert.exists(response.body.rules)
      assert.exists(response.body.periods)
    })
  })

  describe('without Authorization header', () => {
    it('should return a 401 http status code', async function(){
      const org = await Organization.create({rules: {}, slug:'test-org'})

      const response = await test()
        .post(`/api/app/rules` )
        .send(rule)
        .set('Accept', 'application/json')
        .set('Referer', 'http://test-org.orax.com')
        .expect(401)
    })
  })

  describe('with invalid information', () => {
    it('period duration as string should return a 422', async function () {
      const user = await createUser()
      const token = await user.createToken({type: 'session'})
      const jwt = token.getJwt()

      const org = await Organization.create({slug:'test-org'})
      const data = rule
      data.periodDuration = "aString"

      const response = await test()
        .post(`/api/app/rules` )
        .send(data)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${jwt}`)
        .set('Referer', 'http://test-org.orax.com')
        .expect(422)
    })

    it('period duration as a negative number should return a 422', async function () {
      const user = await createUser()
      const token = await user.createToken({type: 'session'})
      const jwt = token.getJwt()

      const org = await Organization.create({rules: {}, slug:'test-org'})
      const data = rule
      data.periodDuration = -1

      const response = await test()
        .post(`/api/app/rules` )
        .send(data)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${jwt}`)
        .set('Referer', 'http://test-org.orax.com')
        .expect(422)
    })

    it('cycle duration as string should return a 422', async function () {
      const user = await createUser()
      const token = await user.createToken({type: 'session'})
      const jwt = token.getJwt()

      const org = await Organization.create({rules: {}, slug:'test-org'})
      const data = rule
      data.cycleDuration = "aString"

      const response = await test()
        .post(`/api/app/rules` )
        .send(data)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${jwt}`)
        .set('Referer', 'http://test-org.orax.com')
        .expect(422)
    })

    it('cycle duration as a negative number should return a 422', async function () {
      const user = await createUser()
      const token = await user.createToken({type: 'session'})
      const jwt = token.getJwt()

      const org = await Organization.create({rules: {}, slug:'test-org'})
      const data = rule
      data.cycleDuration = -1

      const response = await test()
        .post(`/api/app/rules` )
        .send(data)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${jwt}`)
        .set('Referer', 'http://test-org.orax.com')
        .expect(422)
    })

    it('season as string should return a 422', async function () {
      const user = await createUser()
      const token = await user.createToken({type: 'session'})
      const jwt = token.getJwt()

      const org = await Organization.create({rules: {}, slug:'test-org'})
      const data = rule
      data.season = "aString"

      const response = await test()
        .post(`/api/app/rules` )
        .send(data)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${jwt}`)
        .set('Referer', 'http://test-org.orax.com')
        .expect(422)
    })

    it('season as a negative number should return a 422', async function () {
      const user = await createUser()
      const token = await user.createToken({type: 'session'})
      const jwt = token.getJwt()

      const org = await Organization.create({rules: {}, slug:'test-org'})
      const data = rule
      data.season = -1

      const response = await test()
        .post(`/api/app/rules` )
        .send(data)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${jwt}`)
        .set('Referer', 'http://test-org.orax.com')
        .expect(422)
    })

    it('date without correct format should return a 422', async function () {
      const user = await createUser()
      const token = await user.createToken({type: 'session'})
      const jwt = token.getJwt()

      const org = await Organization.create({rules: {}, slug:'test-org'})
      const data = rule
      data.startDate = "01-01-2018"

      const response = await test()
        .post(`/api/app/rules` )
        .send(data)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${jwt}`)
        .set('Referer', 'http://test-org.orax.com')
        .expect(422)
    })

    it('date without correct format should return a 422', async function () {
      const user = await createUser()
      const token = await user.createToken({type: 'session'})
      const jwt = token.getJwt()

      const org = await Organization.create({rules: {}, slug:'test-org'})
      const data = rule
      data.startDate = "01-01-2018"

      const response = await test()
        .post(`/api/app/rules` )
        .send(data)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${jwt}`)
        .set('Referer', 'http://test-org.orax.com')
        .expect(422)
    })
  })
})
