const { DataSetRow } = require('models')
const { datasetRowsToConciliateFixture } = require('../fixtures')

module.exports = function createDatasetRowsUnConciliate(opts = {}) {

  for (var i in datasetRowsToConciliateFixture) {
    const row = datasetRowsToConciliateFixture[i]
    DataSetRow.create(Object.assign({}, row, opts))
  }

  return DataSetRow.find()
}
