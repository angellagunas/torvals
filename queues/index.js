const finishUpload = require('./finish-upload')
const updateDatasetRows = require('./update-datasetrows')
const updatePrices = require('./update-prices')
// #Requires

module.exports = {
  'finish-upload': finishUpload,
  'update-datasetrow': updateDatasetRows,
  'update-prices': updatePrices// #Exports
}
