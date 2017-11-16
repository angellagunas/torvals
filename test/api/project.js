/* global describe, beforeEach, it */
require('co-mocha')

const { expect } = require('chai')
const http = require('http')
const { clearDatabase, createUser } = require('../utils')
const api = require('api/')
const request = require('supertest')
const {Project, Organization} = require('models')

function test () {
  return request(http.createServer(api.callback()))
}

describe('/projects', () => {
  describe('[post] / Create Project', () => {
    it('should return a 200 then the project created', async function () {
      await clearDatabase()
      const org = await Organization.create({
        name: 'Una org',
        description: 'Una descripción'
      })

      const res = await test()
        .post('/api/admin/projects')
        .send({
          name: 'Un proyecto',
          organization: org.uuid,
          description: 'Una descripción de proyecto'

        })
        .set('Accept', 'application/json')
        .expect(200)

      const newProject = await Project.findOne({'uuid': res.body.data.uuid})
      expect(newProject.name).equal('Un proyecto')
      expect(newProject.description).equal('Una descripción de proyecto')
    })

    describe('[get] / Obtain projects', () => {
      it('should return a 200', async function () {
        await test()
        .get('/api/admin/projects')
        .set('Accept', 'application/json')
        .expect(200)
      })

      it('should return list of projects', async function () {
        const res = await test()
        .get('/api/admin/projects')
        .set('Accept', 'application/json')
        .expect(200)

        const projects = await Project.findOne({name: 'Un proyecto'})
        expect(projects.name).equal('Un proyecto')
      })
    })

    describe('[delete] / Soft Delete project', () => {
      it('should return true for deleted', async function () {
        const project = await Project.findOne({name: 'Un proyecto'})
        const res = await test()
        .delete('/api/admin/projects/' + project.uuid)
        .set('Accept', 'application/json')
        .expect(200)

        expect(res.body.data.isDeleted).equal(true)
      })
    })
  })
})
