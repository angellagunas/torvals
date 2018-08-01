const { DataSetRow } = require('models')
const { datasetRowsFixture } = require('../fixtures')

module.exports = function createDatasetRow (opts = {}) {

  for (var i in datasetRowsFixture) {
    const row = datasetRowsFixture[i]
    DataSetRow.create(Object.assign({}, row, opts))
  }

  return DataSetRow.find()
}