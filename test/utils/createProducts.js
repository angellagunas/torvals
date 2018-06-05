const { Product } = require('models')
const { productsFixture } = require('../fixtures')

module.exports = function createProduct (opts = {}) {

  for (var i in productsFixture) {
    const product = productsFixture[i]
    Product.create(Object.assign({}, product, opts))
  }

  return Product.find()
}
