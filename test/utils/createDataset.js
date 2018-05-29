const { DataSet } = require('models')
const { processingDatasetFixture } = require('../fixtures')

module.exports = function createDataset (opts = {}) {
  return DataSet.create(Object.assign({}, processingDatasetFixture, opts))
}
