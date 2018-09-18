const finishUpload = require('./finish-upload')
const updatePrices = require('./update-prices')
const saveDataset = require('./save-dataset')
const processDataset = require('./process-dataset')
const saveDatasetRows = require('./save-datasetrows')
const conciliateDataset = require('./conciliate-dataset')
const conciliateToProject = require('./conciliate-to-project')
const filterDataset = require('./filter-dataset')
const cloneProject = require('./clone-project')
const cloneUpdateRulesMainDataset = require('./clone-update-rules-main-dataset')
const reconfigureDataset = require('./reconfigure-dataset')
const getAnomalies = require('./get-anomalies')
const generateDownload = require('./generate-downloads')
const migrateRowsToHistorical = require('./migrate-rows-to-historical')
const removeDuplicatedCatalogsInAnomalies = require('./remove-duplicated-catalogs-anomalies')
// #Requires

module.exports = {
  'finish-upload': finishUpload,
  'update-prices': updatePrices,
  'conciliate-dataset': conciliateDataset,
  'conciliate-to-project': conciliateToProject,
  'filter-dataset': filterDataset,
  'clone-project': cloneProject,
  'save-dataset': saveDataset,
  'process-dataset': processDataset,
  'save-datasetrows': saveDatasetRows,
  'clone-update-rules-main-dataset': cloneUpdateRulesMainDataset,
  'reconfigure-dataset': reconfigureDataset,
  'getAnomalies': getAnomalies,
  'migrateRowsToHistorical': migrateRowsToHistorical,
  'generateDownload': generateDownload,
  'removeDuplicatedCatalogsInAnomalies': removeDuplicatedCatalogsInAnomalies
}
