/* global describe, beforeEach, it */
require('co-mocha')

const { expect } = require('chai')
const http = require('http')
const { clearDatabase, apiHeaders } = require('../utils')
const api = require('api/')
const request = require('supertest')
const { Product, Organization } = require('models')

function test () {
  return request(http.createServer(api.callback()))
}

describe('/products', () => {
  describe('[post] / Create Product', () => {
    it('should return a 200 then the product created', async function () {
      await clearDatabase()
      const credentials = await apiHeaders()

      const org = await Organization.create({
        name: 'Una org',
        description: 'Una descripción'
      })

      const res = await test()
        .post('/api/admin/products')
        .send({
          name: 'Un producto',
          organization: org.uuid,
          description: 'Una descripción de producto'

        })
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${credentials.token}`)
        .set('Referer', credentials.referer)
        .expect(200)

      const newProduct = await Product.findOne({'uuid': res.body.data.uuid})
      expect(newProduct.name).equal('Un producto')
      expect(newProduct.description).equal('Una descripción de producto')
    })

    describe('[get] / Obtain products', () => {
      it('should return a 200', async function () {
        await clearDatabase()
        const credentials = await apiHeaders()
        await test()
          .get('/api/admin/products')
          .set('Accept', 'application/json')
          .set('Authorization', `Bearer ${credentials.token}`)
          .set('Referer', credentials.referer)
          .expect(200)
      })

      it('should return list of products', async function () {
        await clearDatabase()
        const credentials = await apiHeaders()

        const org = await Organization.create({
          name: 'Una org',
          description: 'Una descripción'
        })

        const product = await Product.create({
          name: 'Un producto',
          organization: org._id,
          description: 'Una descripción de producto'
        })

        const response = await test()
          .get('/api/admin/products')
          .set('Accept', 'application/json')
          .set('Authorization', `Bearer ${credentials.token}`)
          .set('Referer', credentials.referer)
          .expect(200)

        expect(response.body.data[0].name).equal('Un producto')
      })
    })

    describe('[delete] / Soft Delete product', () => {
      it('should return true for deleted', async function () {
        await clearDatabase()
        const credentials = await apiHeaders()

        const org = await Organization.create({
          name: 'Una org',
          description: 'Una descripción'
        })

        const product = await Product.create({
          name: 'Un producto',
          organization: org._id,
          description: 'Una descripción de producto'
        })

        const response = await test()
          .delete('/api/admin/products/' + product.uuid)
          .set('Accept', 'application/json')
          .set('Authorization', `Bearer ${credentials.token}`)
          .set('Referer', credentials.referer)
          .expect(200)

        const updatedProduct = await Product.findOne({uuid: product.uuid})

        expect(updatedProduct.isDeleted).equal(true)
      })
    })
  })
})
