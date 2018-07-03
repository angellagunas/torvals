const { SalesCenter } = require('models')
const { saleCentersFixture } = require('../fixtures')

module.exports = function createSaleCenters(opts = {}) {

  for (var i in saleCentersFixture) {
    const saleCenter = saleCentersFixture[i]
    SalesCenter.create(Object.assign({}, saleCenter, opts))
  }

  return SalesCenter.find()
}
