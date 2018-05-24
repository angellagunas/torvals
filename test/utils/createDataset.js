const { DataSet } = require('models')
const { datasetFixture } = require('../fixtures')

module.exports = function createDataset (opts = {}) {
  return DataSet.create(Object.assign({}, datasetFixture, opts))
}
