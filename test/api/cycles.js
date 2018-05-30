/* global describe, beforeEach, it */
require('co-mocha')

const { assert } = require('chai')
const http = require('http')
const { clearDatabase, createUser } = require('../utils')
const api = require('api/')
const request = require('supertest')
const {DataSet, Organization, User} = require('models')

const { organizationFixture } = require('../fixtures')

function test () {
  return request(http.createServer(api.callback()))
}

describe('organizations/rules/:uuid', () => {
  beforeEach(async function () {
    await clearDatabase()
  })

  describe('with extra data', () => {
    it('should not save a extra fields', async function () {
      const org = await Organization.create({rules: {}, slug:'test-org'})

      const user = await createUser()
      const token = await user.createToken({type: 'session'})
      const jwt = token.getJwt()

      rules = Object.assign(organizationFixture.rules, {extraField: 'random value'})

      const response = await test()
        .post(`/api/app/organizations/rules/${org.uuid}`)
        .send(organizationFixture.rules)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${jwt}`)
        .set('Referer', 'http://test-org.orax.com')
        .expect(200)

      const newOrg = await Organization.findOne({_id: org._id})

      assert.notExists(newOrg.rules.extraField)
    })
  })

  describe('with invalid organization', () => {
    it('should return a 404 status code', async function () {
      const org = await Organization.create({rules: {}, slug:'test-org'})
      const user = await createUser()
      const token = await user.createToken({type: 'session'})
      const jwt = token.getJwt()

      const response = await test()
        .post(`/api/app/organizations/rules/a-invalid-uuid` )
        .send(organizationFixture.rules)
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

      const org = await Organization.create({rules: {}, slug:'test-org'})

      const response = await test()
        .post(`/api/app/organizations/rules/${org.uuid}` )
        .send(organizationFixture.rules)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${jwt}`)
        .set('Referer', 'http://test-org.orax.com')
        .expect(200)

      assert.exists(response.body.data.rules)
    })
  })

  describe('without Authorization header', () => {
    it('should return a 401 http status code', async function(){
      const org = await Organization.create({rules: {}, slug:'test-org'})

      const response = await test()
        .post(`/api/app/organizations/rules/${org.uuid}` )
        .send(organizationFixture.rules)
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

      const org = await Organization.create({rules: {}, slug:'test-org'})
      const data = organizationFixture.rules
      data.periodDuration = "aString"

      const response = await test()
        .post(`/api/app/organizations/rules/${org.uuid}` )
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
      const data = organizationFixture.rules
      data.periodDuration = -1

      const response = await test()
        .post(`/api/app/organizations/rules/${org.uuid}` )
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
      const data = organizationFixture.rules
      data.cycleDuration = "aString"

      const response = await test()
        .post(`/api/app/organizations/rules/${org.uuid}` )
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
      const data = organizationFixture.rules
      data.cycleDuration = -1

      const response = await test()
        .post(`/api/app/organizations/rules/${org.uuid}` )
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
      const data = organizationFixture.rules
      data.season = "aString"

      const response = await test()
        .post(`/api/app/organizations/rules/${org.uuid}` )
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
      const data = organizationFixture.rules
      data.season = -1

      const response = await test()
        .post(`/api/app/organizations/rules/${org.uuid}` )
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
      const data = organizationFixture.rules
      data.startDate = "01-01-2018"

      const response = await test()
        .post(`/api/app/organizations/rules/${org.uuid}` )
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
      const data = organizationFixture.rules
      data.startDate = "01-01-2018"

      const response = await test()
        .post(`/api/app/organizations/rules/${org.uuid}` )
        .send(data)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${jwt}`)
        .set('Referer', 'http://test-org.orax.com')
        .expect(422)
    })
  })
})
