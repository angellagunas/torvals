/* global describe, before, it */
require('co-mocha')

const api = require('api/')
const http = require('http')
const { Role } = require('models')
const { expect } = require('chai')
const request = require('supertest')
const { clearDatabase, apiHeaders } = require('../utils')

function test() {
  return request(http.createServer(api.callback()))
}

describe('Role CRUD', () => {

  describe('[post] /Create a role', () => {
    it('should return a 422 if no data is provided', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()

      await test()
        .post('/api/admin/roles')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(422)
    })

    it('should return a 422 if no name is provided', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()

      await test()
        .post('/api/admin/roles')
        .send({
          description: 'Una descripción'
        })
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(422)
    })

    it('should return a 200 and the role created', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()

      const res = await test()
        .post('/api/admin/roles')
        .send({
          name: 'Un role',
          description: 'Una descripción',
          priority: 1
        })
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(200)

      roleUuid = res.body.data.uuid
      const newOrg = await Role.findOne({'uuid': roleUuid})
      expect(newOrg.name).equal('Un role')
      expect(newOrg.description).equal('Una descripción')
    })
  })

  describe('[post] /Update a role', () => {
    it('should return a 422 if no data is provided', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()
      const role = await Role.create({
        name: 'Un role',
        description: 'Una descripción',
        priority: 1
      })

      await test()
        .post('/api/admin/roles/' + role.uuid)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(422)
    })

    it('should return a 422 if no name is provided', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()
      const role = await Role.create({
        name: 'Un role',
        description: 'Una descripción',
        priority: 1
      })

      await test()
        .post('/api/admin/roles/' + role.uuid)
        .send({
          description: 'Una descripción'
        })
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(422)
    })

    it("should return a 404 if the role isn't found", async function () {
      await clearDatabase()
      const credentials = await apiHeaders()

      await test()
        .post('/api/admin/roles/blaaaaaa')
        .send({
          name: 'Un role',
          description: 'Otra descripción'
        })
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(404)
    })

    it('should return a 200 and the role updated', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()
      const role = await Role.create({
        name: 'Un role',
        description: 'Una descripción',
        priority: 1
      })

      const response = await test()
        .post('/api/admin/roles/' + role.uuid)
        .send({
          name: 'Un role',
          description: 'Otra descripción',
          priority: 1
        })
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(200)

      expect(response.body.data.name).equal('Un role')
      expect(response.body.data.description).equal('Otra descripción')
    })
  })

  describe('[get] A role', () => {
    it("should return a 404 if the role isn't found", async function () {
      await clearDatabase()
      const credentials = await apiHeaders()

      await test()
        .get('/api/admin/roles/blaaaaaa')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(404)
    })

    it('should return a 200 and the role requested', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()

      const role = await Role.create({
        name: 'test_role',
        description:'test',
        slug: 'test_role'
      })

      const res = await test()
        .get('/api/admin/roles/' + role.uuid)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(200)

      expect(res.body.data.name).equal('test_role')
      expect(res.body.data.description).equal('test')
    })
  })

  describe('[delete] A role', () => {
    it("should return a 404 if the role isn't found", async function () {
      await clearDatabase()
      const credentials = await apiHeaders()

      await test()
        .delete('/api/admin/roles/blaaaaaa')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(404)
    })

    it('should return a 200 and set isDeleted to true', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()

      const role = await Role.create({
        name: 'test_role',
        description:'test',
        slug: 'test_role'
      })
      await test()
        .delete('/api/admin/roles/' + role.uuid)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(200)

      const newOrg = await Role.findOne({'uuid': role.uuid})
      expect(newOrg.isDeleted).equal(true)
    })
  })
})
