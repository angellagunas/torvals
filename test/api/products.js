/* global describe, beforeEach, it */
require('co-mocha')

const { expect } = require('chai')
const http = require('http')
const { clearDatabase, createUser } = require('../utils')
const api = require('api/')
const request = require('supertest')
const {Product, Organization} = require('models')

function test () {
  return request(http.createServer(api.callback()))
}

describe('/products', () => {
  describe('[post] / Create Product', () => {
    it('should return a 200 then the product created', async function () {
      await clearDatabase()
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
        .expect(200)

      const newProduct = await Product.findOne({'uuid': res.body.data.uuid})
      expect(newProduct.name).equal('Un producto')
      expect(newProduct.description).equal('Una descripción de producto')
    })

    describe('[get] / Obtain products', () => {
      it('should return a 200', async function () {
        await test()
        .get('/api/admin/products')
        .set('Accept', 'application/json')
        .expect(200)
      })

      it('should return list of products', async function () {
        const res = await test()
        .get('/api/admin/products')
        .set('Accept', 'application/json')
        .expect(200)

        const products = await Product.findOne({name: 'Un producto'})
        expect(products.name).equal('Un producto')
      })
    })

    describe('[delete] / Soft Delete product', () => {
      it.skip('should return true for deleted', async function () {
        const product = await Product.findOne({name: 'Un producto'})
        const res = await test()
        .delete('/api/admin/products/' + product.uuid)
        .set('Accept', 'application/json')
        .expect(200)

        expect(res.body.data.isDeleted).equal(true)
      })
    })
  })
})
