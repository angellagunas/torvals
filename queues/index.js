const finishUpload = require('./finish-upload')
const updateDatasetRows = require('./update-datasetrows')
const updatePrices = require('./update-prices')
const saveDataset = require('./save-dataset')
const conciliateDataset = require('./conciliate-dataset')
// #Requires

module.exports = {
  'finish-upload': finishUpload,
  'update-datasetrow': updateDatasetRows,
  'update-prices': updatePrices,
  'conciliate-dataset': conciliateDataset,
  'save-dataset': saveDataset// #Exports
}
