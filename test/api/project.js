/* global describe, beforeEach, it */
require('co-mocha')

const api = require('api/')
const http = require('http')
const { expect } = require('chai')
const request = require('supertest')
const { Project, Organization } = require('models')
const {
  clearDatabase,
  createProject,
  apiHeaders,
  createDataset,
  createFileChunk
} = require('../utils')

function test() {
  return request(http.createServer(api.callback()))
}

describe('/projects', () => {

  describe('[post] / Create Project', () => {
    it('should return a 200 then the project created', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()

      const res = await test()
        .post('/api/app/projects')
        .send({
          name: 'Un proyecto',
          organization: credentials.org.uuid,
          description: 'Una descripción de proyecto'
        })
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(200)

      const newProject = await Project.findOne({'uuid': res.body.data.uuid})
      expect(newProject.name).equal('Un proyecto')
      expect(newProject.description).equal('Una descripción de proyecto')
    })
  })

  describe('[get] / Obtain projects', () => {
    it('should return a 200', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()

      await test()
      .get('/api/admin/projects')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${credentials.token}`)
      .set('Referer', credentials.referer)
      .expect(200)
    })

    it('should return list of projects', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()

      const project = await createProject({
        organization: credentials.org._id,
        createdBy: credentials.user._id
      })

      const res = await test()
      .get('/api/admin/projects')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${credentials.token}`)
      .set('Referer', credentials.referer)
      .expect(200)

      const projects = await Project.find({}).count()
      expect(projects).equal(res.body.total)
    })

    it('with filter hasMainDataset as true should return only projects with main datatset', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()

      const project = await createProject({
        organization: credentials.org._id,
        createdBy: credentials.user._id
      })

      const projectWithouMainDataset = await createProject({
        organization: credentials.org._id,
        createdBy: credentials.user._id
      })

      const dataset = await createDataset({
        organization: credentials.org._id,
        createdBy: credentials.user._id,
        project: project._id,
        dateMax: "2018-05-16",
        dateMin: "2017-10-04"
      })

      const chunk = await createFileChunk()

      dataset.set({
        fileChunk: chunk,
        status: 'ready',
        uploadedBy: credentials.user._id
      })

      project.set({
        mainDataset: dataset._id,
        dateMin: dataset.dateMin,
        dateMax: dataset.dateMax
      })

      dataset.set({
        isMain: true,
        status: 'ready'
      })

      await dataset.save()
      await project.save()

      const res = await test()
      .get('/api/app/projects?hasMainDataset=true')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${credentials.token}`)
      .set('Referer', credentials.referer)
      .expect(200)

      expect(res.body.total).equals(1)
      expect(res.body.total).equals(res.body.data.length)
    })
  })

  describe('[delete] / Soft Delete project', () => {
    it('should return true for deleted', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()

      const project = await createProject({
        organization: credentials.org._id,
        createdBy: credentials.user._id
      })

      const res = await test()
      .delete('/api/admin/projects/' + project.uuid)
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${credentials.token}`)
      .set('Referer', credentials.referer)
      .expect(200)

      expect(res.body.data.isDeleted).equal(true)
    })
  })
})
