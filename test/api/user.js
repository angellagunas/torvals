/* global describe, beforeEach, it */
require('co-mocha')

const lov = require('lov')
const api = require('api/')
const http = require('http')
const { expect } = require('chai')
const request = require('supertest')
const { User, UserToken } = require('models')
const { clearDatabase, apiHeaders } = require('../utils')

function test () {
  return request(http.createServer(api.callback()))
}

describe('/user', () => {
  const password = '1234'

  describe('[post] / Create user', () => {
    it('should return a error', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()

      await test()
        .post('/api/user/')
        .send()
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(422)
    })

    it('should return a 200 with user and jwt', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()
      const email = 'app@user.com'
      const res = await test()
        .post('/api/user')
        .send({
          password: '4321',
          email: email,
          displayName: 'App User',
          name: 'au'
        })
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(200)

      expect(res.body.user.email).equal(email)
      expect(res.body.user.uuid).to.have.lengthOf(36)
      expect(typeof res.body.jwt).equal('string')
    })
  })

  describe('[post] /me/update', () => {
    it('should return a error', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()
      await test()
        .post('/api/user/me/update')
        .send()
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(422)
    })

    it('should return a 403 if no user data is sent', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()
      await test()
        .post('/api/user/me/update')
        .send({
          email: 'app@user.com',
          name: 'newNick'
        })
        .set('Accept', 'application/json')
        .set('Referer', credentials.referer)
        .expect(403)
    })

    it('should return a 200', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()

      const res = await test()
        .post('/api/user/me/update')
        .send({
          email: 'app@user.com',
          name: 'newNick',
          uuid: credentials.user.uuid
        })
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .set('Accept', 'application/json')
        .expect(200)

      expect(res.body.user.uuid).equal(credentials.user.uuid)
    })
  })

  describe('[post] /me/update-password', () => {
    it('should return a error', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()
      await test()
        .post('/api/user/me/update-password')
        .send()
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(422)
    })

    it('should return a 403 if no user data is send', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()
      const newPassword = '123'

      await test()
        .post('/api/user/me/update-password')
        .send({
          password: password,
          newPassword: newPassword,
          confirmPassword: newPassword
        })
        .set('Accept', 'application/json')
        .set('Referer', credentials.referer)
        .expect(403)
    })

    it('should return a 200', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()
      const newPassword = '123'

      const res = await test()
        .post('/api/user/me/update-password')
        .send({
          password: password,
          newPassword: newPassword,
          confirmPassword: newPassword
        })
        .set('Referer', credentials.referer)
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Accept', 'application/json')
        .expect(200)

      expect(res.body.user.uuid).equal(credentials.user.uuid)

      const updatedUser = await User.findOne({uuid: credentials.user.uuid})
      expect(await updatedUser.validatePassword(newPassword)).equal(true)
    })
  })

  describe('[post] /login', () => {
    it('should return a error', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()

      await test()
        .post('/api/user/login')
        .send({ password: '4321', email: credentials.user.email })
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(401)
    })

    it('should create a session', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()

      const res = await test()
        .post('/api/user/login')
        .send({ password, email: credentials.user.email })
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(200)

      expect(res.body.user.email).equal(credentials.user.email)
    })
  })

  describe('[get] /me gets user data with a jwt token', () => {
    it('should return a 200 with loggedIn false', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()
      const res = await test()
        .get('/api/user/me')
        .set('Accept', 'application/json')
        .set('Referer', credentials.referer)
        .expect(200)

      expect(res.body.loggedIn).equal(false)
    })

    it('should return user data', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()

      const res = await test()
        .get('/api/user/me')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(200)

      expect(res.body.loggedIn).equal(true)
    })

    it('should return 401 for invalid jwt', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()
      await test()
        .get('/api/user/me')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer Invalid`)
        .set('Referer', credentials.referer)
        .expect(401)
    })
  })

  describe('[get] /me gets user data with a api token', () => {

    it('should return a 200 with loggedIn false', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()

      const res = await test()
        .get('/api/user/me')
        .set('Accept', 'application/json')
        .set('Referer', credentials.referer)
        .expect(200)

      expect(res.body.loggedIn).equal(false)
    })

    it('should return user data', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()
      const token = await credentials.user.createToken({type: 'api'})
      const basicAuth = Buffer.from(token.key + ':' + token.secret).toString('base64')

      const res = await test()
        .get('/api/user/me')
        .set('Accept', 'application/json')
        .set('Authorization', `Basic ${basicAuth}`)
        .set('Referer', credentials.referer)
        .expect(200)

      expect(res.body.loggedIn).equal(true)
    })

    it('should return 401 for invalid jwt', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()
      await test()
        .get('/api/user/me')
        .set('Accept', 'application/json')
        .set('Authorization', `Basic Invalid`)
        .set('Referer', credentials.referer)
        .expect(401)
    })
  })

  describe('[post] /tokens create API tokens', () => {
    it('should return a 403 when no auth is sended', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()
      await test()
        .post('/api/user/tokens')
        .send({ name: 'new token' })
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(403)
    })

    it('should return a 403 when basic auth is sended', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()
      const token = await credentials.user.createToken({type: 'api'})
      const basicAuth = Buffer.from(token.key + ':' + token.secret).toString('base64')

      await test()
        .post('/api/user/tokens')
        .send({ name: 'new token' })
        .set('Accept', 'application/json')
        .set('Authorization', `Basic ${basicAuth}`)
        .set('Referer', credentials.referer)
        .expect(403)
    })

    it('should return a 200 and token data for Bearer auth', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()

      const res = await test()
        .post('/api/user/tokens')
        .send({name: 'new token', organization: credentials.org.uuid})
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(200)

      const schema = {
        uuid: lov.string().uuid().required(),
        key: lov.string().uuid().required(),
        secret: lov.string().uuid().required(),
        name: lov.string().required(),
        organization: lov.object().required()
      }

      const result = lov.validate(res.body.token, schema)

      expect(res.body.token.name).equal('new token')
      expect(result.error).equal(null)
    })
  })

  describe('[get] /tokens list active APi tokens', () => {
    it('should return a 403 when no auth is sended', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()
      await test()
        .get('/api/user/tokens')
        .set('Accept', 'application/json')
        .set('Referer', credentials.referer)
        .expect(403)
    })

    it('should return a 403 when basic auth is sended', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()
      const token = await credentials.user.createToken({type: 'api'})
      const basicAuth = Buffer.from(token.key + ':' + token.secret).toString('base64')

      await test()
        .get('/api/user/tokens')
        .set('Accept', 'application/json')
        .set('Authorization', `Basic ${basicAuth}`)
        .set('Referer', credentials.referer)
        .expect(403)
    })

    it('should return a 200 and token data for Bearer auth', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()

      // Create tokens
      await test()
        .post('/api/user/tokens')
        .send({name: 'new token', organization: credentials.org.uuid})
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(200)

      await test()
        .post('/api/user/tokens')
        .send({name: 'secondary token', organization: credentials.org.uuid})
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(200)

      const res = await test()
        .get('/api/user/tokens')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(200)

      const schema = {
        uuid: lov.string().uuid().required(),
        key: lov.string().uuid().required(),
        name: lov.string().required(),
        organization: lov.object().required()
      }

      expect(res.body.tokens.length).equal(2)
      expect(lov.validate(res.body.tokens[0], schema).error).equal(null)
      expect(lov.validate(res.body.tokens[1], schema).error).equal(null)
    })
  })

  describe('[delete] / Revoke current session token', () => {
    it('should return 401 after session token is revoked', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()

      const res = await test()
        .get('/api/user/me')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(200)

      expect(res.body.loggedIn).equal(true)

      await test().del('/api/user/')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(200)

      await test().get('/api/user/me')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(401)
    })

    it('should have one deleted token in the DB', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()

      const res = await test()
        .get('/api/user/me')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(200)

      expect(res.body.loggedIn).equal(true)

      expect(await UserToken.count({isDeleted: {$ne: true}})).equal(1)

      await test().del('/api/user/')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(200)

      await test().get('/api/user/me')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(401)

      expect(await UserToken.count()).equal(1)
      expect(await UserToken.count({isDeleted: {$ne: true}})).equal(0)
    })

    it('should return 403 is a api token tries to be revoked this way', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()

      const apiToken = await credentials.user.createToken({type: 'api', name: 'foo'})
      const basicAuth = Buffer.from(apiToken.key + ':' + apiToken.secret).toString('base64')

      await test().del('/api/user/')
        .set('Accept', 'application/json')
        .set('Authorization', `Basic ${basicAuth}`)
        .set('Referer', credentials.referer)
        .expect(403)
    })
  })

  describe('[delete] /tokens/:uuid Revoke api token', () => {
    it('should return a 403 when no auth is sended', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()
      await test()
        .delete('/api/user/tokens/invalid')
        .set('Accept', 'application/json')
        .set('Referer', credentials.referer)
        .expect(403)
    })

    it('should return 200 and {success: true} when deleting with Bearer auth', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()

      const apiToken = await credentials.user.createToken({type: 'api', name: 'foo'})

      const res = await test()
        .del(`/api/user/tokens/${apiToken.uuid}`)
        .set('Accept', 'application/json')
        .set('Referer', credentials.referer)
        .set('Authorization', `Bearer ${credentials.token}`)
        .expect(200)

      expect(res.body.success).equal(true)
    })

    it('should return 200 and {success: true} when deleting current api token', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()
      const apiToken = await credentials.user.createToken({type: 'api', name: 'foo'})
      const basicAuth = Buffer.from(apiToken.key + ':' + apiToken.secret).toString('base64')

      const res = await test()
        .del(`/api/user/tokens/${apiToken.uuid}`)
        .set('Accept', 'application/json')
        .set('Authorization', `Basic ${basicAuth}`)
        .set('Referer', credentials.referer)
        .expect(200)

      expect(res.body.success).equal(true)
    })

    it('should return 403 and {success: true} when deleting other api token', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()
      const apiToken = await credentials.user.createToken({type: 'api', name: 'foo'})
      const secondaryToken = await credentials.user.createToken({type: 'api', name: 'bar'})
      const basicAuth = Buffer.from(apiToken.key + ':' + apiToken.secret).toString('base64')

      await test()
        .del(`/api/user/tokens/${secondaryToken.uuid}`)
        .set('Accept', 'application/json')
        .set('Authorization', `Basic ${basicAuth}`)
        .set('Referer', credentials.referer)
        .expect(403)
    })

    it('should return be removed from the token list', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()

      await credentials.user.createToken({
        type: 'api',
        name: 'bar',
        organization: credentials.org._id
      })

      const apiToken = await credentials.user.createToken({
        type: 'api',
        name: 'foo',
        organization: credentials.org._id
      })

      const basicAuth = Buffer.from(apiToken.key + ':' + apiToken.secret).toString('base64')

      const firstRes = await test()
        .get('/api/user/tokens')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(200)

      expect(firstRes.body.tokens.length).equal(2)

      await test()
        .del(`/api/user/tokens/${apiToken.uuid}`)
        .set('Accept', 'application/json')
        .set('Authorization', `Basic ${basicAuth}`)
        .set('Referer', credentials.referer)
        .expect(200)

      const secondRes = await test()
        .get('/api/user/tokens')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(200)

      expect(secondRes.body.tokens.length).equal(1)
      expect(secondRes.body.tokens[0].name).equal('bar')
    })

    it('should return an error if the tokens does not has organization', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()

      const apiToken = await credentials.user.createToken({
        type: 'api',
        name: 'bar'
      })

      const basicAuth = Buffer.from(apiToken.key + ':' + apiToken.secret).toString('base64')

      const firstRes = await test()
        .get('/api/user/tokens')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(422)
    })

    it('should return be removed from the token list', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()

      const apiToken = await credentials.user.createToken({type: 'api', name: 'foo'})
      const basicAuth = Buffer.from(apiToken.key + ':' + apiToken.secret).toString('base64')

      await test()
        .del(`/api/user/tokens/${apiToken.uuid}`)
        .set('Accept', 'application/json')
        .set('Authorization', `Basic ${basicAuth}`)
        .set('Referer', credentials.referer)
        .expect(200)

      await test()
        .get('/api/user/me')
        .set('Accept', 'application/json')
        .set('Authorization', `Basic ${basicAuth}`)
        .set('Referer', credentials.referer)
        .expect(401)

      expect(await UserToken.count()).equal(2)
      expect(await UserToken.count({isDeleted: {$ne: true}})).equal(1)
    })
  })
})
