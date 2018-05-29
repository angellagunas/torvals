const finishUpload = require('./finish-upload')
const updatePrices = require('./update-prices')
const saveDataset = require('./save-dataset')
const processDataset = require('./process-dataset')
const saveDatasetRows = require('./save-datasetrows')
const conciliateDataset = require('./conciliate-dataset')
const filterDataset = require('./filter-dataset')
const cloneProject = require('./clone-project')
const getAnomalies = require('./get-anomalies')
// #Requires

module.exports = {
  'finish-upload': finishUpload,
  'update-prices': updatePrices,
  'conciliate-dataset': conciliateDataset,
  'filter-dataset': filterDataset,
  'clone-project': cloneProject,
  'save-dataset': saveDataset,
  'process-dataset': processDataset,
  'save-datasetrows': saveDatasetRows,
  'getAnomalies': getAnomalies// #Exports
}
