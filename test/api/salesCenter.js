/* global describe, beforeEach, it */
require('co-mocha')

const { expect } = require('chai')
const http = require('http')
const { clearDatabase, createUser } = require('../utils')
const api = require('api/')
const request = require('supertest')
const {SalesCenter, Organization, Group} = require('models')

function test () {
  return request(http.createServer(api.callback()))
}

describe('/salesCenters', () => {
  describe('[post] / Create SalesCenter', () => {
    it('should return a 200 then the salesCenter created', async function () {
      await clearDatabase()
      const org = await Organization.create({
        name: 'Una org',
        description: 'Una descripción'
      })

      const group = await Group.create({
        name: 'Una grupo',
        description: 'Una descripción de grupo'
      })

      const group2 = await Group.create({
        name: 'Una grupo2',
        description: 'Una descripción de grupo2'
      })

      const res = await test()
        .post('/api/admin/salesCenters')
        .send({
          name: 'Un sales center',
          organization: org.uuid,
          description: 'Una descripción de sales center',
          address: 'Dinamarca 86, Col. Juárez C.P. 06600 CDMX',
          groups: [
            group._id,
            group2._id
          ],
          externalId: '1234567'

        })
        .set('Accept', 'application/json')
        .expect(200)

      const newSalesCenter = await SalesCenter.findOne({'uuid': res.body.data.uuid})
      expect(newSalesCenter.name).equal('Un sales center')
      expect(newSalesCenter.description).equal('Una descripción de sales center')
    })

    describe('[get] / Obtain salesCenters', () => {
      it('should return a 200', async function () {
        await test()
        .get('/api/admin/salesCenters')
        .set('Accept', 'application/json')
        .expect(200)
      })

      it('should return list of salesCenters', async function () {
        const res = await test()
        .get('/api/admin/salesCenters')
        .set('Accept', 'application/json')
        .expect(200)

        const salesCenter = await SalesCenter.findOne({name: 'Un sales center'})
        expect(salesCenter.name).equal('Un sales center')
      })
    })

    describe('[delete] / Soft Delete salesCenter', () => {
      it('should return true for deleted', async function () {
        const salesCenter = await SalesCenter.findOne({name: 'Un sales center'})
        const res = await test()
        .delete('/api/admin/salesCenters/' + salesCenter.uuid)
        .set('Accept', 'application/json')
        .expect(200)

        expect(res.body.data.isDeleted).equal(true)
      })
    })
  })
})
