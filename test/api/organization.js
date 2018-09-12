/* global describe, before, it */
require('co-mocha')

const { expect } = require('chai')
const http = require('http')
const { clearDatabase, apiHeaders } = require('../utils')
const api = require('api/')
const request = require('supertest')
const { Organization, Role, User } = require('models')

function test () {
  return request(http.createServer(api.callback()))
}

describe('Organization CRUD', () => {
  before(async function () {
    await clearDatabase()
  })

  describe('[post] /Create an organization', () => {
    it('should return a 422 if no data is provided', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()
      await test()
        .post('/api/admin/organizations')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(422)
    })

    it('should return a 422 if no name is provided', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()
      await test()
        .post('/api/admin/organizations')
        .send({
          description: 'Una descripción'
        })
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(422)
    })

    it('should return a 200 and the org created', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()
      const res = await test()
        .post('/api/admin/organizations')
        .send({
          name: 'Una org',
          description: 'Una descripción'
        })
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(200)

      orgUuid = res.body.data.uuid
      const newOrg = await Organization.findOne({'uuid': orgUuid})
      expect(newOrg.name).equal('Una org')
      expect(newOrg.description).equal('Una descripción')
    })
  })

  describe('[post] /Update an organization', () => {
    it('should return a 422 if no data is provided', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()
      await test()
        .post('/api/admin/organizations/' + orgUuid)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(422)
    })

    it('should return a 422 if no name is provided', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()
      await test()
        .post('/api/admin/organizations/' + orgUuid)
        .send({
          description: 'Una descripción'
        })
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(422)
    })

    it("should return a 404 if the org isn't found", async function () {
      await clearDatabase()
      const credentials = await apiHeaders()

      await test()
        .post('/api/admin/organizations/a_invalid_org')
        .send({
          name: 'Una org',
          description: 'Otra descripción',
          slug: 'a_fake_slug'
        })
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(404)
    })
  })

  describe('[get] An organization', () => {
    it("should return a 404 if the org isn't found", async function () {
      await clearDatabase()
      const credentials = await apiHeaders()
      await test()
        .get('/api/admin/organizations/blaaaaaa')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(404)
    })

    it('should return a 200 and the org requested', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()
      const org = await Organization.create({rules: {}, slug:'test-org'})

      const res = await test()
        .get('/api/admin/organizations/' + org.uuid)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(200)

      expect(res.body.data.slug).equal(org.slug)
      expect(res.body.data.uuid).equal(org.uuid)
    })
  })

  describe('[post] Add user to an organization', () => {
    it('should return a 404', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()
      await test()
        .get('/api/admin/users/' + credentials.user.uuid + '/add/organization')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(404)
    })

    it("should return a 404 if the organization isn't found", async function () {
      await clearDatabase()
      const credentials = await apiHeaders()
      await test()
        .post('/api/admin/users/' + credentials.user.uuid + '/add/organization')
        .send({
          organization: 'blaaaa'
        })
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(404)
    })

    it("should return a 404 if the user isn't found", async function () {
      await clearDatabase()
      const credentials = await apiHeaders()
      await test()
        .post('/api/admin/users/blaaa/add/organization')
        .send({
          organization: 'blaaaa'
        })
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(404)
    })

    it('should add a user to an organzation and return a 200', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()

      const role = await Role.create({name: 'test_role', slug: 'test_role'})
      const org = await Organization.create({rules: {}, slug:'test-org'})

      const res = await test()
        .post('/api/admin/users/' + credentials.user.uuid + '/add/organization')
        .send({
          organization: org.uuid,
          role: role.uuid
        })
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(200)

      const newOrg = await Organization.findOne({'uuid': org.uuid}).populate('users')
      const updatedUser = await User.findOne({'uuid': credentials.user.uuid})

      expect(res.body.data.organizations[0].organization.uuid).equal(newOrg.uuid)
      expect(String(updatedUser.organizations[0].organization)).equal(String(org._id))
    })
  })

  describe('[post] Remove user from a organization', () => {
    it('should return a 404', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()
      await test()
        .get('/api/admin/users/' + credentials.user.uuid + '/remove/organization')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(404)
    })

    it("should return a 404 if the organization isn't found", async function () {
      await clearDatabase()
      const credentials = await apiHeaders()
      await test()
        .post('/api/admin/users/' + credentials.user.uuid + '/remove/organization')
        .send({
          organization: 'blaaaa'
        })
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(404)
    })

    it("should return a 404 if the user isn't found", async function () {
      await clearDatabase()
      const credentials = await apiHeaders()
      await test()
        .post('/api/admin/users/blaaa/remove/organization')
        .send({
          organization: 'blaaaa'
        })
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(404)
    })

    it('should return a 200', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()
      const org = await Organization.create({rules: {}, slug:'test-org'})

      const res = await test()
        .post('/api/admin/users/' + credentials.user.uuid + '/remove/organization')
        .send({
          organization: org.uuid
        })
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(200)

      expect(res.body.data.organizations.length).equal(0)
    })
  })

  describe('[delete] An organization', () => {
    it("should return a 404 if the org isn't found", async function () {
      await clearDatabase()
      const credentials = await apiHeaders()
      await test()
        .delete('/api/admin/organizations/blaaaaaa')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(404)
    })

    it('should return a 200 and set isDeleted to true', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()
      const org = await Organization.create({rules: {}, slug:'test-org'})

      await test()
        .delete('/api/admin/organizations/' + org.uuid)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(200)

      const newOrg = await Organization.findOne({'uuid': org.uuid})
      expect(newOrg.isDeleted).equal(true)
    })
  })
})
