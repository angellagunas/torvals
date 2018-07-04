/* global describe, before, it */
require('co-mocha')

const { expect } = require('chai')
const http = require('http')
const { clearDatabase, apiHeaders } = require('../utils')
const api = require('api/')
const request = require('supertest')
const { Group, User } = require('models')

function test () {
  return request(http.createServer(api.callback()))
}

describe('Group CRUD', () => {
  describe('[post] /Create an group', () => {
    it('should return a 422 if no data is provided', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()

      const response = await test()
        .post('/api/admin/groups')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(422)
    })

    it('should return a 422 if no name is provided', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()

      await test()
        .post('/api/admin/groups')
        .send({
          description: 'Una descripción'
        })
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(422)
    })

    it('should return a 200 and the group created', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()

      const response = await test()
        .post('/api/admin/groups')
        .send({
          name: 'Un group',
          description: 'Una descripción'
        })
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(200)

      expect(response.body.data.name).equal('Un group')
      expect(response.body.data.description).equal('Una descripción')
    })
  })

  describe('[post] /Update an group', () => {
    it('should return a 422 if no data is provided', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()

      const group = await Group.create({
        name: 'Un group',
        description: 'Una descripción'
      })

      await test()
        .post('/api/admin/groups/' + group.uuid)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(422)
    })

    it('should return a 422 if no name is provided', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()

      const group = await Group.create({
        name: 'Un group',
        description: 'Una descripción'
      })

      await test()
        .post('/api/admin/groups/' + group.uuid)
        .send({
          description: 'Una descripción'
        })
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(422)
    })

    it("should return a 404 if the group isn't found", async function () {
      await clearDatabase()
      const credentials = await apiHeaders()

      await test()
        .post('/api/admin/groups/blaaaaaa')
        .send({
          name: 'Un group',
          description: 'Otra descripción'
        })
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(404)
    })

    it('should return a 200 and the group updated', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()

      const group = await Group.create({
        name: 'Un group',
        description: 'Una descripción'
      })

      const response = await test()
        .post('/api/admin/groups/' + group.uuid)
        .send({
          name: 'Un group',
          description: 'Otra descripción'
        })
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(200)

      expect(response.body.data.name).equal('Un group')
      expect(response.body.data.description).equal('Otra descripción')
    })
  })

  describe('[get] A group', () => {
    it("should return a 404 if the group isn't found", async function () {
      await clearDatabase()
      const credentials = await apiHeaders()

      await test()
        .get('/api/admin/groups/blaaaaaa')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(404)
    })

    it('should return a 200 and the group requested', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()

      const group = await Group.create({
        name: 'Un group',
        description: 'Una descripción'
      })

      const res = await test()
        .get('/api/admin/groups/' + group.uuid)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(200)

      expect(res.body.data.name).equal('Un group')
      expect(res.body.data.description).equal('Una descripción')
    })
  })

  describe('[post] Add user to a group', () => {
    it('should return a 404', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()

      await test()
        .get('/api/admin/users/' + credentials.user.uuid + '/add/group')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(404)
    })

    it("should return a 404 if the group isn't found", async function () {
      await clearDatabase()
      const credentials = await apiHeaders()

      await test()
        .post('/api/admin/users/' + credentials.user.uuid + '/add/group')
        .send({
          group: 'blaaaa'
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
        .post('/api/admin/users/blaaa/add/group')
        .send({
          group: 'blaaaa'
        })
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(404)
    })

    it('should return a 200', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()

      const group = await Group.create({name: 'new group'})

      const res = await test()
        .post('/api/admin/users/' + credentials.user.uuid + '/add/group')
        .send({
          group: group.uuid
        })
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(200)

      const newGroup = await Group.findOne({'uuid': group.uuid}).populate('users')

      expect(res.body.data.groups[0].uuid).equal(group.uuid)
      expect(newGroup.users[0].uuid).equal(credentials.user.uuid)
    })
  })

  describe('[post] Remove user from a group', () => {
    it('should return a 404', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()

      await test()
        .get('/api/admin/users/' + credentials.user.uuid + '/remove/group')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(404)
    })

    it("should return a 404 if the group isn't found", async function () {
      await clearDatabase()
      const credentials = await apiHeaders()

      await test()
        .post('/api/admin/users/' + credentials.user.uuid + '/remove/group')
        .send({
          group: 'blaaaa'
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
        .post('/api/admin/users/blaaa/remove/group')
        .send({
          group: 'blaaaa'
        })
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(404)
    })

    it('should return a 200', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()

      const group = await Group.create({
        name: 'Un group',
        description: 'Una descripción'
      })

      const res = await test()
        .post('/api/admin/users/' + credentials.user.uuid + '/remove/group')
        .send({
          group: group.uuid
        })
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(200)

      expect(res.body.data.groups.length).equal(0)
      const newGroup = await Group.findOne({'uuid': group.uuid})
      expect(newGroup.users.length).equal(0)
    })
  })

  describe('[delete] A group', () => {

    it("should return a 404 if the group isn't found", async function () {
      await clearDatabase()
      const credentials = await apiHeaders()

      await test()
        .delete('/api/admin/groups/blaaaaaa')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(404)
    })

    it('should return a 200 and set isDeleted to true', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()

      const group = await Group.create({
        name: 'Un group',
        description: 'Una descripción'
      })

      await test()
        .delete('/api/admin/groups/' + group.uuid)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(200)

      const newGroup = await Group.findOne({'uuid': group.uuid})
      const newUser = await User.findOne({'uuid': credentials.user.uuid})
      expect(newGroup.isDeleted).equal(true)
      expect(newGroup.users.length).equal(0)
      expect(newUser.groups.length).equal(0)
    })
  })
})
